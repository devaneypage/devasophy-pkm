#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FIXTURE_DIR="$(mktemp -d /tmp/devasophy-endpoints.XXXXXX)"
INVENTORY_PATH="$(mktemp /tmp/devasophy-trpc-inventory.XXXXXX.json)"
RESULT_PATH="${ENDPOINT_RESULT_PATH:-/tmp/devasophy-endpoint-results.json}"
SERVER_LOG="$(mktemp /tmp/devasophy-endpoint-server.XXXXXX.log)"
SERVER_PID=""

cleanup() {
  if [[ -n "${SERVER_PID}" ]]; then
    kill -TERM "${SERVER_PID}" 2>/dev/null || true
    wait "${SERVER_PID}" 2>/dev/null || true
  fi
  rm -rf "${FIXTURE_DIR}" "${INVENTORY_PATH}" "${SERVER_LOG}"
}
trap cleanup EXIT

cat > "${FIXTURE_DIR}/Quotes-All_with_notes_with_metadata.json" <<'JSON'
[{"quote":"Endpoint Smoke fixture","by":"Manus endpoint suite"}]
JSON
cat > "${FIXTURE_DIR}/Clavis_Aurea_Complete.json" <<'JSON'
{"meta":{"name":"Clavis Aurea"},"entries":[{"term":"Aletheia","definition":"Disclosure."}]}
JSON

cd "${PROJECT_ROOT}"
pnpm check
pnpm test
pnpm build
pnpm exec tsx scripts/inventory-trpc-procedures.ts > "${INVENTORY_PATH}"

TEST_PORT=""
for candidate in $(seq 3100 3119); do
  if ! ss -ltn | grep -q ":${candidate} "; then
    TEST_PORT="${candidate}"
    break
  fi
done
if [[ -z "${TEST_PORT}" ]]; then
  echo "No test port available in range 3100-3119" >&2
  exit 1
fi

PORT="${TEST_PORT}" \
PKM_IMPORT_SOURCE_DIR="${FIXTURE_DIR}" \
NODE_ENV=production \
node dist/index.js > "${SERVER_LOG}" 2>&1 &
SERVER_PID=$!

ready=0
for _ in $(seq 1 60); do
  if curl -fsS --get "http://127.0.0.1:${TEST_PORT}/api/trpc/system.health" \
    --data-urlencode 'input={"json":{"timestamp":0}}' >/dev/null; then
    ready=1
    break
  fi
  sleep 1
done
if [[ "${ready}" -ne 1 ]]; then
  cat "${SERVER_LOG}" >&2
  exit 1
fi

TEST_BASE_URL="http://127.0.0.1:${TEST_PORT}" \
TRPC_INVENTORY_PATH="${INVENTORY_PATH}" \
ENDPOINT_RESULT_PATH="${RESULT_PATH}" \
python scripts/verify-all-endpoints.py

echo "Web-app suite passed. Endpoint result: ${RESULT_PATH}"
