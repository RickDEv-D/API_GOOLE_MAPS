const logEl = document.getElementById('log');
const balanceEl = document.getElementById('balance');
const statementEl = document.getElementById('statement');
const userIdEl = document.getElementById('userId');
const kycStatusEl = document.getElementById('kycStatus');

let currentUserId = null;

function log(message, data) {
  const line = `[${new Date().toLocaleTimeString()}] ${message}`;
  const payload = data ? `\n${JSON.stringify(data, null, 2)}` : '';
  logEl.textContent = `${line}${payload}\n\n${logEl.textContent}`;
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Erro na API');
  return json;
}

async function refreshWallet() {
  if (!currentUserId) return;
  const [balance, statement] = await Promise.all([
    api(`/api/wallet/balance?userId=${currentUserId}`),
    api(`/api/wallet/statement?userId=${currentUserId}`),
  ]);
  balanceEl.textContent = JSON.stringify(balance, null, 2);
  statementEl.textContent = JSON.stringify(statement, null, 2);
}

document.getElementById('registerBtn').addEventListener('click', async () => {
  try {
    const email = document.getElementById('email').value;
    const cpf = document.getElementById('cpf').value;
    const data = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, cpf }),
      headers: { 'Idempotency-Key': `reg-${email}` },
    });

    currentUserId = data.userId;
    userIdEl.textContent = currentUserId;
    kycStatusEl.textContent = data.kycStatus;
    log('Usuário cadastrado', data);
    await refreshWallet();
  } catch (error) {
    log(error.message);
  }
});

document.getElementById('approveKycBtn').addEventListener('click', async () => {
  if (!currentUserId) return log('Cadastre o usuário antes');
  try {
    const data = await api('/api/kyc/approve', {
      method: 'POST',
      body: JSON.stringify({ userId: currentUserId }),
    });
    kycStatusEl.textContent = data.kycStatus;
    log('KYC aprovado', data);
  } catch (error) {
    log(error.message);
  }
});

async function runOperation(path, label) {
  if (!currentUserId) return log('Cadastre o usuário antes');
  const amount = Number(document.getElementById('amount').value || 0);
  try {
    const data = await api(path, {
      method: 'POST',
      body: JSON.stringify({ userId: currentUserId, amount }),
      headers: { 'Idempotency-Key': `${path}-${currentUserId}-${amount}` },
    });
    log(label, data);
    await refreshWallet();
  } catch (error) {
    log(error.message);
  }
}

document.getElementById('depositBtn').addEventListener('click', () => runOperation('/api/payments/deposit', 'Depósito confirmado'));
document.getElementById('betBtn').addEventListener('click', () => runOperation('/api/games/bet', 'Aposta registrada'));
document.getElementById('winBtn').addEventListener('click', () => runOperation('/api/games/win', 'Ganho registrado'));
document.getElementById('withdrawBtn').addEventListener('click', () => runOperation('/api/payments/withdraw', 'Saque processado'));
document.getElementById('refreshBtn').addEventListener('click', refreshWallet);
