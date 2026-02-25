# Bet Platform Console (integrado)

Projeto full-stack de demonstração com **layout operacional** integrado ao backend para fluxos de aposta:
- cadastro e KYC básico,
- depósito PIX (simulado), bet, win e saque,
- wallet + extrato de ledger double-entry,
- dashboard visual com métricas e checklist de compliance,
- lobby de jogos populares (Aviator, Mines, Roleta, Slots, Live Blackjack) com interação simulada,
- acesso ao PRD completo pelo próprio layout.

## Estrutura

```text
API_GOOLE_MAPS/
├─ backend/
│  └─ server.js
├─ frontend/
│  ├─ index.html
│  ├─ styles.css
│  └─ app.js
├─ PRD_PLATAFORMA_APOSTAS_BR.md
└─ README.md
```

## Executar

```bash
node backend/server.js
```

Acesse:
- `http://localhost:3000`


## Teste rápido (smoke test)

Para "ligar e testar" automaticamente o fluxo principal:

```bash
./scripts/smoke_test.sh
```

O script sobe o backend, valida healthcheck e executa: cadastro -> KYC -> depósito -> bet -> win -> saque -> valida saldo/extrato.

## Endpoints

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/kyc/approve`
- `POST /api/payments/deposit`
- `POST /api/payments/withdraw`
- `POST /api/games/bet`
- `POST /api/games/win`
- `GET /api/wallet/balance?userId=...`
- `GET /api/wallet/statement?userId=...`

## Observação

MVP técnico com persistência em memória para facilitar validação rápida de layout + integração de fluxo.
