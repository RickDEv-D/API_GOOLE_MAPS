const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = Number(process.env.PORT || 3000);

const db = {
  users: new Map(),
  wallets: new Map(),
  transactions: [],
  idempotency: new Map(),
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
      if (data.length > 1e6) {
        reject(new Error('Payload too large'));
      }
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

function getOrCreateWallet(userId) {
  if (!db.wallets.has(userId)) {
    db.wallets.set(userId, {
      userId,
      currency: 'BRL',
      balances: {
        cash: 0,
        bonus: 0,
        blocked: 0,
      },
      statement: [],
    });
  }
  return db.wallets.get(userId);
}

function appendLedgerTx({ userId, type, amount, externalRef, entries }) {
  const totalDebit = entries.reduce((acc, entry) => acc + entry.debit, 0);
  const totalCredit = entries.reduce((acc, entry) => acc + entry.credit, 0);
  if (totalDebit !== totalCredit) {
    throw new Error('Ledger transaction is unbalanced');
  }

  const tx = {
    id: `tx_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    userId,
    type,
    amount,
    externalRef,
    entries,
    createdAt: new Date().toISOString(),
  };

  db.transactions.push(tx);
  const wallet = getOrCreateWallet(userId);
  wallet.statement.unshift(tx);
  return tx;
}

function applyDeposit(userId, amount, externalRef) {
  const wallet = getOrCreateWallet(userId);
  wallet.balances.cash += amount;
  return appendLedgerTx({
    userId,
    type: 'deposit_confirmed',
    amount,
    externalRef,
    entries: [
      { account: 'payment_clearing', debit: amount, credit: 0 },
      { account: 'player_cash_balance', debit: 0, credit: amount },
    ],
  });
}

function applyBet(userId, amount, externalRef) {
  const wallet = getOrCreateWallet(userId);
  if (wallet.balances.cash < amount) {
    throw new Error('Saldo insuficiente');
  }
  wallet.balances.cash -= amount;
  return appendLedgerTx({
    userId,
    type: 'game_bet',
    amount,
    externalRef,
    entries: [
      { account: 'player_cash_balance', debit: amount, credit: 0 },
      { account: 'operator_liability', debit: 0, credit: amount },
    ],
  });
}

function applyWin(userId, amount, externalRef) {
  const wallet = getOrCreateWallet(userId);
  wallet.balances.cash += amount;
  return appendLedgerTx({
    userId,
    type: 'game_win',
    amount,
    externalRef,
    entries: [
      { account: 'operator_liability', debit: amount, credit: 0 },
      { account: 'player_cash_balance', debit: 0, credit: amount },
    ],
  });
}

function applyWithdrawal(userId, amount, externalRef) {
  const wallet = getOrCreateWallet(userId);
  if (wallet.balances.cash < amount) {
    throw new Error('Saldo insuficiente para saque');
  }
  wallet.balances.cash -= amount;
  return appendLedgerTx({
    userId,
    type: 'withdrawal_confirmed',
    amount,
    externalRef,
    entries: [
      { account: 'player_cash_balance', debit: amount, credit: 0 },
      { account: 'payment_clearing', debit: 0, credit: amount },
    ],
  });
}

async function handleApi(req, res, pathname) {
  const key = req.headers['idempotency-key'];
  if (key && db.idempotency.has(key)) {
    return sendJson(res, 200, db.idempotency.get(key));
  }

  if (req.method === 'POST' && pathname === '/api/auth/register') {
    const body = await readBody(req);
    if (!body.email || !body.cpf) {
      return sendJson(res, 400, { error: 'email e cpf são obrigatórios' });
    }

    const userId = `usr_${Date.now()}`;
    db.users.set(userId, {
      id: userId,
      email: body.email,
      cpfHash: Buffer.from(body.cpf).toString('base64'),
      kycStatus: 'PENDING',
      createdAt: new Date().toISOString(),
    });

    getOrCreateWallet(userId);
    const response = { userId, kycStatus: 'PENDING' };
    if (key) db.idempotency.set(key, response);
    return sendJson(res, 201, response);
  }

  if (req.method === 'POST' && pathname === '/api/kyc/approve') {
    const body = await readBody(req);
    const user = db.users.get(body.userId);
    if (!user) return sendJson(res, 404, { error: 'Usuário não encontrado' });
    user.kycStatus = 'APPROVED';
    const response = { userId: user.id, kycStatus: user.kycStatus };
    if (key) db.idempotency.set(key, response);
    return sendJson(res, 200, response);
  }

  if (req.method === 'POST' && pathname === '/api/payments/deposit') {
    const body = await readBody(req);
    const user = db.users.get(body.userId);
    if (!user) return sendJson(res, 404, { error: 'Usuário não encontrado' });
    const amount = Number(body.amount || 0);
    if (amount <= 0) return sendJson(res, 400, { error: 'Valor inválido' });

    const tx = applyDeposit(body.userId, amount, body.externalRef || 'pix_manual');
    const response = { status: 'CONFIRMED', transaction: tx };
    if (key) db.idempotency.set(key, response);
    return sendJson(res, 201, response);
  }

  if (req.method === 'POST' && pathname === '/api/payments/withdraw') {
    const body = await readBody(req);
    const user = db.users.get(body.userId);
    if (!user) return sendJson(res, 404, { error: 'Usuário não encontrado' });
    if (user.kycStatus !== 'APPROVED') {
      return sendJson(res, 403, { error: 'KYC deve estar aprovado para saque' });
    }

    const amount = Number(body.amount || 0);
    if (amount <= 0) return sendJson(res, 400, { error: 'Valor inválido' });

    try {
      const tx = applyWithdrawal(body.userId, amount, body.externalRef || 'pix_withdraw');
      const response = { status: 'CONFIRMED', transaction: tx };
      if (key) db.idempotency.set(key, response);
      return sendJson(res, 201, response);
    } catch (error) {
      return sendJson(res, 400, { error: error.message });
    }
  }

  if (req.method === 'POST' && pathname === '/api/games/bet') {
    const body = await readBody(req);
    const amount = Number(body.amount || 0);
    if (amount <= 0) return sendJson(res, 400, { error: 'Valor inválido' });

    try {
      const tx = applyBet(body.userId, amount, body.providerTxId || 'bet_manual');
      const response = { status: 'RECORDED', transaction: tx };
      if (key) db.idempotency.set(key, response);
      return sendJson(res, 201, response);
    } catch (error) {
      return sendJson(res, 400, { error: error.message });
    }
  }

  if (req.method === 'POST' && pathname === '/api/games/win') {
    const body = await readBody(req);
    const amount = Number(body.amount || 0);
    if (amount <= 0) return sendJson(res, 400, { error: 'Valor inválido' });

    const tx = applyWin(body.userId, amount, body.providerTxId || 'win_manual');
    const response = { status: 'RECORDED', transaction: tx };
    if (key) db.idempotency.set(key, response);
    return sendJson(res, 201, response);
  }

  if (req.method === 'GET' && pathname === '/api/wallet/balance') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const userId = url.searchParams.get('userId');
    const wallet = db.wallets.get(userId);
    if (!wallet) return sendJson(res, 404, { error: 'Wallet não encontrada' });
    return sendJson(res, 200, wallet.balances);
  }

  if (req.method === 'GET' && pathname === '/api/wallet/statement') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const userId = url.searchParams.get('userId');
    const wallet = db.wallets.get(userId);
    if (!wallet) return sendJson(res, 404, { error: 'Wallet não encontrada' });
    return sendJson(res, 200, wallet.statement.slice(0, 30));
  }

  if (req.method === 'GET' && pathname === '/api/health') {
    return sendJson(res, 200, {
      status: 'ok',
      users: db.users.size,
      wallets: db.wallets.size,
      transactions: db.transactions.length,
    });
  }

  return sendJson(res, 404, { error: 'Rota não encontrada' });
}

function resolveStaticPath(pathname) {
  if (pathname === '/') return path.join(__dirname, '..', 'frontend', 'index.html');

  const rootPublicFiles = new Set(['/PRD_PLATAFORMA_APOSTAS_BR.md', '/README.md']);
  if (rootPublicFiles.has(pathname)) {
    return path.join(__dirname, '..', pathname.slice(1));
  }

  return path.join(__dirname, '..', 'frontend', pathname);
}

function serveStatic(req, res, pathname) {
  const filePath = resolveStaticPath(pathname);
  const repoRoot = path.join(__dirname, '..');

  if (!filePath.startsWith(repoRoot)) {
    sendJson(res, 403, { error: 'Forbidden' });
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      sendJson(res, 404, { error: 'Arquivo não encontrado' });
      return;
    }

    const ext = path.extname(filePath);
    const mime = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.md': 'text/markdown; charset=utf-8',
    }[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    if (pathname.startsWith('/api/')) {
      await handleApi(req, res, pathname);
      return;
    }

    serveStatic(req, res, pathname);
  } catch (error) {
    sendJson(res, 500, { error: error.message });
  }
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
}

module.exports = { server, db, appendLedgerTx };
