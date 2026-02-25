#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${PORT:-3000}"
BASE_URL="http://127.0.0.1:${PORT}"

SERVER_PID=""
cleanup() {
  if [[ -n "${SERVER_PID}" ]] && kill -0 "${SERVER_PID}" 2>/dev/null; then
    kill "${SERVER_PID}" >/dev/null 2>&1 || true
    wait "${SERVER_PID}" 2>/dev/null || true
  fi
}
trap cleanup EXIT

start_server() {
  node "${ROOT_DIR}/backend/server.js" >/tmp/bet-platform-smoke.log 2>&1 &
  SERVER_PID=$!

  for _ in {1..30}; do
    if curl -s "${BASE_URL}/api/health" >/dev/null 2>&1; then
      return
    fi
    sleep 0.2
  done

  echo "Falha ao iniciar servidor. Log:"
  cat /tmp/bet-platform-smoke.log || true
  exit 1
}

json_field() {
  local json="$1"
  local field="$2"
  node -e "const d=JSON.parse(process.argv[1]); const v=d[process.argv[2]]; if (v===undefined) process.exit(2); process.stdout.write(String(v));" "$json" "$field"
}

start_server

echo "[1/8] Health"
health_json="$(curl -s "${BASE_URL}/api/health")"
health_status="$(json_field "$health_json" "status")"
[[ "$health_status" == "ok" ]]

echo "[2/8] Register"
register_json="$(curl -s -X POST "${BASE_URL}/api/auth/register" \
  -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: smoke-register' \
  -d '{"email":"smoke@example.com","cpf":"12345678900"}')"
user_id="$(json_field "$register_json" "userId")"
[[ "$user_id" == usr_* ]]

echo "[3/8] Approve KYC"
curl -s -X POST "${BASE_URL}/api/kyc/approve" \
  -H 'Content-Type: application/json' \
  -d "{\"userId\":\"${user_id}\"}" >/dev/null

echo "[4/8] Deposit"
curl -s -X POST "${BASE_URL}/api/payments/deposit" \
  -H 'Content-Type: application/json' \
  -d "{\"userId\":\"${user_id}\",\"amount\":120}" >/dev/null

echo "[5/8] Bet"
curl -s -X POST "${BASE_URL}/api/games/bet" \
  -H 'Content-Type: application/json' \
  -d "{\"userId\":\"${user_id}\",\"amount\":20}" >/dev/null

echo "[6/8] Win"
curl -s -X POST "${BASE_URL}/api/games/win" \
  -H 'Content-Type: application/json' \
  -d "{\"userId\":\"${user_id}\",\"amount\":50}" >/dev/null

echo "[7/8] Withdraw"
curl -s -X POST "${BASE_URL}/api/payments/withdraw" \
  -H 'Content-Type: application/json' \
  -d "{\"userId\":\"${user_id}\",\"amount\":30}" >/dev/null

echo "[8/8] Balance + statement"
balance_json="$(curl -s "${BASE_URL}/api/wallet/balance?userId=${user_id}")"
cash="$(json_field "$balance_json" "cash")"
[[ "$cash" == "120" ]]

statement_len="$(curl -s "${BASE_URL}/api/wallet/statement?userId=${user_id}" | node -e 'const d=JSON.parse(require("fs").readFileSync(0,"utf8")); process.stdout.write(String(d.length));')"
[[ "$statement_len" == "4" ]]

echo "Smoke test OK ✅"
