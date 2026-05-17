const preview = document.getElementById('preview');
const ctx = preview.getContext('2d');
const output = document.getElementById('output');
const downloadJsonBtn = document.getElementById('downloadJsonBtn');
const verifyBtn = document.getElementById('verifyBtn');
const exportPdfBtn = document.getElementById('exportPdfBtn');

let baseImageData = null;
let generated = null;

const fields = ['product', 'batch', 'manufactureDate', 'expiryDate', 'quantity', 'templateName'];
fields.forEach((id) => document.getElementById(id).addEventListener('input', renderPreview));

function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

function setDefaultDates() {
  const today = new Date();
  const nextYear = new Date(today);
  nextYear.setFullYear(today.getFullYear() + 1);
  if (!document.getElementById('manufactureDate').value) document.getElementById('manufactureDate').value = toISODate(today);
  if (!document.getElementById('expiryDate').value) document.getElementById('expiryDate').value = toISODate(nextYear);
}

document.getElementById('baseImage').addEventListener('change', async (e) => {
  const [file] = e.target.files;
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    baseImageData = reader.result;
    renderPreview();
  };
  reader.readAsDataURL(file);
});

function getFormValues() {
  return {
    product: document.getElementById('product').value.trim(),
    batch: document.getElementById('batch').value.trim(),
    manufactureDate: document.getElementById('manufactureDate').value,
    expiryDate: document.getElementById('expiryDate').value,
    quantity: Number(document.getElementById('quantity').value),
    templateName: document.getElementById('templateName').value.trim(),
  };
}

function drawLabel(values, qrText = 'TOKEN_DEMO') {
  ctx.clearRect(0, 0, preview.width, preview.height);

  if (baseImageData) {
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, preview.width, preview.height);
      drawOverlay(values, qrText);
    };
    img.src = baseImageData;
  } else {
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, preview.width, preview.height);
    drawOverlay(values, qrText);
  }
}

function drawOverlay(values, qrText) {
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 22px Arial';
  ctx.fillText(values.product || 'Produto', 20, 36);
  ctx.font = '16px Arial';
  ctx.fillText(`Lote: ${values.batch || '-'}`, 20, 70);
  ctx.fillText(`Fab: ${values.manufactureDate || '-'}`, 20, 100);
  ctx.fillText(`Val: ${values.expiryDate || '-'}`, 20, 130);

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrText)}`;
  const qr = new Image();
  qr.crossOrigin = 'anonymous';
  qr.onload = () => {
    ctx.drawImage(qr, preview.width - 150, preview.height - 150, 120, 120);
    ctx.fillStyle = '#ddd';
    ctx.font = '10px monospace';
    ctx.fillText('QR anti-fraude', preview.width - 150, preview.height - 20);
  };
  qr.onerror = () => {
    ctx.fillStyle = '#ddd';
    ctx.font = '12px monospace';
    ctx.fillText('QR indisponível (sem internet)', preview.width - 220, preview.height - 30);
  };
  qr.src = qrUrl;
}

function renderPreview() {
  drawLabel(getFormValues());
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Erro de API');
  return json;
}

document.getElementById('generateBtn').addEventListener('click', async () => {
  try {
    const values = getFormValues();
    generated = await api('/api/labels/generate', {
      method: 'POST',
      body: JSON.stringify(values),
    });

    output.textContent = JSON.stringify({ batchId: generated.batchId, quantity: generated.quantity, sample: generated.labels.slice(0, 3) }, null, 2);
    downloadJsonBtn.disabled = false;
    verifyBtn.disabled = false;
    exportPdfBtn.disabled = false;
    drawLabel(values, generated.labels[0].qrPayload);
  } catch (error) {
    output.textContent = error.message;
  }
});

downloadJsonBtn.addEventListener('click', () => {
  if (!generated) return;
  const blob = new Blob([JSON.stringify(generated, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${generated.batchId}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

verifyBtn.addEventListener('click', async () => {
  if (!generated?.labels?.length) return;
  try {
    const token = generated.labels[0].qrPayload;
    const result = await api(`/api/labels/verify?token=${encodeURIComponent(token)}`);
    output.textContent = `${output.textContent}\n\nVerificação:\n${JSON.stringify(result, null, 2)}`;
  } catch (error) {
    output.textContent = `${output.textContent}\n\nErro na verificação:\n${error.message}`;
  }
});

setDefaultDates();
renderPreview();


function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildPrintHtml(batch, backgroundImage) {
  const labelsHtml = batch.labels
    .map((label) => {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(label.qrPayload)}`;
      const bgStyle = backgroundImage ? `background-image:url('${backgroundImage}');background-size:cover;background-position:center;` : '';
      return `
      <article class="label" style="${bgStyle}">
        <div class="overlay">
          <h3>${escapeHtml(label.product)}</h3>
          <p><strong>Lote:</strong> ${escapeHtml(label.batch)}</p>
          <p><strong>Fab:</strong> ${escapeHtml(label.manufactureDate)}</p>
          <p><strong>Val:</strong> ${escapeHtml(label.expiryDate)}</p>
          <p><strong>Código:</strong> ${escapeHtml(label.code)}</p>
          <img src="${qrUrl}" alt="QR code etiqueta" />
        </div>
      </article>`;
    })
    .join('');

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<title>Impressão de Etiquetas ${escapeHtml(batch.batchId)}</title>
<style>
  @page { size: A4; margin: 10mm; }
  body { font-family: Arial, sans-serif; margin: 0; }
  .sheet { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8mm; }
  .label { min-height: 45mm; border: 1px solid #222; border-radius: 3mm; overflow: hidden; background:#fff; }
  .overlay { background: rgba(255,255,255,0.86); min-height: 100%; padding: 3mm; }
  h3 { margin: 0 0 2mm; font-size: 13pt; }
  p { margin: 0 0 1mm; font-size: 9pt; }
  img { width: 28mm; height: 28mm; display: block; margin-top: 2mm; }
</style>
</head>
<body>
  <section class="sheet">${labelsHtml}</section>
  <script>window.onload=()=>window.print();</script>
</body>
</html>`;
}

exportPdfBtn.addEventListener('click', () => {
  if (!generated?.labels?.length) return;
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    output.textContent = `${output.textContent}\n\nErro: permita pop-up para exportar PDF.`;
    return;
  }

  const html = buildPrintHtml(generated, baseImageData);
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
});
