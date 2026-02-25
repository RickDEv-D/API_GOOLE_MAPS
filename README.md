# Bet Platform Demo (Front-end + Back-end)

Projeto de demonstração full-stack com foco em conceitos pedidos para uma plataforma de apostas:
- onboarding básico e KYC manual,
- wallet com lançamentos em **ledger double-entry**,
- operações de depósito, aposta, ganho e saque,
- front-end simples para operar os fluxos.

## Estrutura

```text
API_GOOLE_MAPS/
├─ backend/
│  └─ server.js
├─ frontend/
│  ├─ index.html
│  ├─ styles.css
│  └─ app.js
└─ PRD_PLATAFORMA_APOSTAS_BR.md
```

## Como rodar

```bash
node backend/server.js
```

Depois abra:

- `http://localhost:3000`

## Endpoints principais

- `POST /api/auth/register`
- `POST /api/kyc/approve`
- `POST /api/payments/deposit`
- `POST /api/payments/withdraw`
- `POST /api/games/bet`
- `POST /api/games/win`
- `GET /api/wallet/balance?userId=...`
- `GET /api/wallet/statement?userId=...`

## Observação

Este projeto é um **MVP técnico demonstrativo** (dados em memória, sem autenticação real de produção).
