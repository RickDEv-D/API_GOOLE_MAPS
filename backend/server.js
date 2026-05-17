const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');

const PORT = Number(process.env.PORT || 3000);
const SECRET = process.env.QR_SECRET || 'demo-secret-key-change-me';

const db = {
  labelBatches: new Map(),
  labelsByCode: new Map(),
  codeNonce: 0,
};

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 2e6) reject(new Error('Payload too large'));
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
  });
}

function sign(payload) {
  return crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
}

function createLabel({ product, batch, manufactureDate, expiryDate, serial }) {
  db.codeNonce += 1;
  const code = `LBL-${Date.now()}-${db.codeNonce}-${serial}`;
  const core = JSON.stringify({ code, product, batch, manufactureDate, expiryDate, serial });
  const signature = sign(core);
  return {
    code,
    product,
    batch,
    manufactureDate,
    expiryDate,
    serial,
    signature,
    qrPayload: Buffer.from(`${core}.${signature}`).toString('base64url'),
    createdAt: new Date().toISOString(),
  };
}

async function handleApi(req, res, pathname) {
  if (req.method === 'POST' && pathname === '/api/labels/generate') {
    const body = await readBody(req);
    const quantity = Math.min(Number(body.quantity || 0), 5000);
    const mfg = new Date(body.manufactureDate);
    const exp = new Date(body.expiryDate);

    if (!body.product || !body.batch || !body.manufactureDate || !body.expiryDate || !Number.isFinite(quantity) || quantity <= 0) {
      return sendJson(res, 400, { error: 'Campos obrigatórios: product, batch, manufactureDate, expiryDate, quantity' });
    }

    if (Number.isNaN(mfg.getTime()) || Number.isNaN(exp.getTime()) || exp <= mfg) {
      return sendJson(res, 400, { error: 'Datas inválidas: validade deve ser maior que fabricação' });
    }

    const batchId = `batch_${Date.now()}`;
    const labels = Array.from({ length: quantity }, (_, i) =>
      createLabel({
        product: body.product,
        batch: body.batch,
        manufactureDate: body.manufactureDate,
        expiryDate: body.expiryDate,
        serial: i + 1,
      }),
    );

    labels.forEach((label) => db.labelsByCode.set(label.code, label));
    db.labelBatches.set(batchId, { batchId, templateName: body.templateName || 'template', quantity, labels, createdAt: new Date().toISOString() });

    return sendJson(res, 201, { batchId, quantity, labels });
  }

  if (req.method === 'GET' && pathname === '/api/labels/verify') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    if (!token) return sendJson(res, 400, { valid: false, reason: 'token ausente' });

    try {
      const decoded = Buffer.from(token, 'base64url').toString('utf8');
      const [core, signature] = decoded.split('.');
      const expected = sign(core);
      if (signature !== expected) return sendJson(res, 200, { valid: false, reason: 'assinatura inválida' });

      const parsed = JSON.parse(core);
      const label = db.labelsByCode.get(parsed.code);
      if (!label) return sendJson(res, 200, { valid: false, reason: 'etiqueta não encontrada' });

      return sendJson(res, 200, { valid: true, label });
    } catch {
      return sendJson(res, 200, { valid: false, reason: 'token inválido' });
    }
  }

  return sendJson(res, 404, { error: 'Rota não encontrada' });
}

function serveStatic(req, res, pathname) {
  const publicDir = path.join(__dirname, '..', 'frontend');
  const fileMap = {
    '/': 'index.html',
    '/app.js': 'app.js',
    '/styles.css': 'styles.css',
  };

  const filename = fileMap[pathname];
  if (!filename) {
    res.writeHead(404);
    return res.end('Not found');
  }

  const fullPath = path.join(publicDir, filename);
  fs.readFile(fullPath, (err, data) => {
    if (err) {
      res.writeHead(500);
      return res.end('Server error');
    }

    const ext = path.extname(filename);
    const contentTypes = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
    };

    res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  try {
    if (url.pathname.startsWith('/api/')) {
      return await handleApi(req, res, url.pathname);
    }
    return serveStatic(req, res, url.pathname);
  } catch (error) {
    return sendJson(res, 500, { error: error.message || 'Erro interno' });
  }
});

server.listen(PORT, () => {
  console.log(`Server on http://localhost:${PORT}`);
});
