const logEl = document.getElementById('log');
const balanceEl = document.getElementById('balance');
const statementEl = document.getElementById('statement');
const userIdEl = document.getElementById('userId');
const kycStatusEl = document.getElementById('kycStatus');
const cashBalanceEl = document.getElementById('cashBalance');
const lastEventEl = document.getElementById('lastEvent');
const gamesGridEl = document.getElementById('gamesGrid');

const gamesCatalog = [
  { id: 'aviator', name: 'Aviator', category: 'Crash', rtp: '97.00%', volatility: 'Alta', mood: '🚀' },
  { id: 'mines', name: 'Mines', category: 'Instantâneo', rtp: '95.50%', volatility: 'Alta', mood: '💣' },
  { id: 'roleta', name: 'Roleta Europeia', category: 'Mesa', rtp: '97.30%', volatility: 'Média', mood: '🎯' },
  { id: 'sweet-bonanza', name: 'Sweet Bonanza', category: 'Slot', rtp: '96.51%', volatility: 'Alta', mood: '🍬' },
  { id: 'fortune-tiger', name: 'Fortune Tiger', category: 'Slot', rtp: '96.80%', volatility: 'Média', mood: '🐯' },
  { id: 'live-blackjack', name: 'Live Blackjack', category: 'Casino ao vivo', rtp: '99.20%', volatility: 'Baixa', mood: '🂡' },
];

let currentUserId = null;

function setLastEvent(text) {
  lastEventEl.textContent = text;
}

function formatBRL(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

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
  cashBalanceEl.textContent = formatBRL(balance.cash);
}

function randomMultiplier() {
  return Number((1 + Math.random() * 2.6).toFixed(2));
}

async function playGame(gameId) {
  const game = gamesCatalog.find((item) => item.id === gameId);
  if (!game) return;
  if (!currentUserId) return log('Cadastre um usuário antes de jogar.');

  const amount = Number(document.getElementById('amount').value || 0);
  if (amount <= 0) return log('Informe um valor de aposta válido.');

  const multiplier = randomMultiplier();
  const winAmount = Number((amount * multiplier).toFixed(2));

  try {
    const bet = await api('/api/games/bet', {
      method: 'POST',
      body: JSON.stringify({ userId: currentUserId, amount, providerTxId: `${game.id}-bet-${Date.now()}` }),
      headers: { 'Idempotency-Key': `${game.id}-bet-${currentUserId}-${amount}` },
    });

    const win = await api('/api/games/win', {
      method: 'POST',
      body: JSON.stringify({ userId: currentUserId, amount: winAmount, providerTxId: `${game.id}-win-${Date.now()}` }),
      headers: { 'Idempotency-Key': `${game.id}-win-${currentUserId}-${amount}-${multiplier}` },
    });

    setLastEvent(`${game.name} jogado`);
    log(`Jogo ${game.name}: bet ${formatBRL(amount)} | win ${formatBRL(winAmount)} | x${multiplier}`, {
      bet,
      win,
      game,
    });

    await refreshWallet();
  } catch (error) {
    setLastEvent(`Falha no jogo ${game.name}`);
    log(error.message);
  }
}

function renderGames() {
  gamesGridEl.innerHTML = gamesCatalog
    .map((game) => `
      <article class="game-card">
        <div class="game-head">
          <h3>${game.mood} ${game.name}</h3>
          <span class="badge">${game.category}</span>
        </div>
        <p class="game-meta">RTP: <strong>${game.rtp}</strong> · Volatilidade: <strong>${game.volatility}</strong></p>
        <button class="play-btn" data-game-id="${game.id}">Jogar agora</button>
      </article>
    `)
    .join('');

  gamesGridEl.querySelectorAll('[data-game-id]').forEach((button) => {
    button.addEventListener('click', () => playGame(button.dataset.gameId));
  });
}

document.getElementById('registerBtn').addEventListener('click', async () => {
  try {
    const email = document.getElementById('email').value.trim();
    const cpf = document.getElementById('cpf').value.trim();
    const data = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, cpf }),
      headers: { 'Idempotency-Key': `register-${email}` },
    });

    currentUserId = data.userId;
    userIdEl.textContent = currentUserId;
    kycStatusEl.textContent = data.kycStatus;
    setLastEvent('Cadastro efetuado');
    log('Usuário cadastrado com sucesso', data);
    await refreshWallet();
  } catch (error) {
    setLastEvent('Erro no cadastro');
    log(error.message);
  }
});

document.getElementById('approveKycBtn').addEventListener('click', async () => {
  if (!currentUserId) return log('Cadastre um usuário antes de aprovar KYC.');

  try {
    const data = await api('/api/kyc/approve', {
      method: 'POST',
      body: JSON.stringify({ userId: currentUserId }),
      headers: { 'Idempotency-Key': `kyc-${currentUserId}` },
    });

    kycStatusEl.textContent = data.kycStatus;
    setLastEvent('KYC aprovado');
    log('KYC atualizado', data);
  } catch (error) {
    setLastEvent('Falha no KYC');
    log(error.message);
  }
});

async function runOperation(path, label) {
  if (!currentUserId) return log('Cadastre um usuário antes de operar.');

  const amount = Number(document.getElementById('amount').value || 0);

  try {
    const data = await api(path, {
      method: 'POST',
      body: JSON.stringify({ userId: currentUserId, amount }),
      headers: { 'Idempotency-Key': `${path}-${currentUserId}-${amount}` },
    });

    setLastEvent(label);
    log(label, data);
    await refreshWallet();
  } catch (error) {
    setLastEvent('Falha de operação');
    log(error.message);
  }
}

document.getElementById('depositBtn').addEventListener('click', () => runOperation('/api/payments/deposit', 'Depósito PIX confirmado'));
document.getElementById('betBtn').addEventListener('click', () => runOperation('/api/games/bet', 'Bet registrada'));
document.getElementById('winBtn').addEventListener('click', () => runOperation('/api/games/win', 'Win registrada'));
document.getElementById('withdrawBtn').addEventListener('click', () => runOperation('/api/payments/withdraw', 'Saque PIX processado'));

document.getElementById('refreshBtn').addEventListener('click', async () => {
  try {
    await refreshWallet();
    setLastEvent('Wallet atualizada');
  } catch (error) {
    log(error.message);
  }
});

renderGames();
