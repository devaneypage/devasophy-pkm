#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FIXTURE_DIR="$(mktemp -d /tmp/devasophy-endpoints.XXXXXX)"
INVENTORY_PATH="$(mktemp /tmp/devasophy-trpc-inventory.XXXXXX.json)"
RESULT_PATH="${ENDPOINT_RESULT_PATH:-/tmp/devasophy-endpoint-results.json}"
SERVER_LOG="$(mktemp /tmp/devasophy-endpoint-server.XXXXXX.log)"
SERVER_PID=""
MOCK_FORGE_PID=""

cleanup() {
  if [[ -n "${SERVER_PID}" ]]; then
    kill -TERM "${SERVER_PID}" 2>/dev/null || true
    wait "${SERVER_PID}" 2>/dev/null || true
  fi
  if [[ -n "${MOCK_FORGE_PID}" ]]; then
    kill -TERM "${MOCK_FORGE_PID}" 2>/dev/null || true
    wait "${MOCK_FORGE_PID}" 2>/dev/null || true
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
pnpm check:bundle
pnpm exec tsx scripts/inventory-trpc-procedures.ts > "${INVENTORY_PATH}"

if [[ "${WEBAPP_TEST_SEED_OWNER:-0}" == "1" ]]; then
  node scripts/seed-ci-owner.mjs
fi

if [[ "${WEBAPP_TEST_MOCK_FORGE:-0}" == "1" ]]; then
  if [[ -z "${MOCK_FORGE_PORT:-}" ]]; then
    for candidate in $(seq 3120 3139); do
      if ! ss -ltn | grep -q ":${candidate} "; then
        export MOCK_FORGE_PORT="${candidate}"
        break
      fi
    done
  fi
  if [[ -z "${MOCK_FORGE_PORT:-}" ]]; then
    echo "No Forge mock port available in range 3120-3139" >&2
    exit 1
  fi
  export BUILT_IN_FORGE_API_URL="http://127.0.0.1:${MOCK_FORGE_PORT}"
  export BUILT_IN_FORGE_API_KEY="ci-mock-key"
  node scripts/mock-forge-server.mjs > /tmp/devasophy-mock-forge.log 2>&1 &
  MOCK_FORGE_PID=$!
  mock_ready=0
  for _ in $(seq 1 30); do
    if curl -fsS "http://127.0.0.1:${MOCK_FORGE_PORT}/v1/storage/presign/get?path=health-check" >/dev/null; then
      mock_ready=1
      break
    fi
    sleep 1
  done
  if [[ "${mock_ready}" -ne 1 ]]; then
    cat /tmp/devasophy-mock-forge.log >&2
    exit 1
  fi
fi

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

mkdir -p "$(dirname "${RESULT_PATH}")"
TEST_BASE_URL="http://127.0.0.1:${TEST_PORT}" \
TRPC_INVENTORY_PATH="${INVENTORY_PATH}" \
ENDPOINT_RESULT_PATH="${RESULT_PATH}" \
python scripts/verify-all-endpoints.py

if [[ -n "${WEBAPP_TEST_SCREENSHOT_PATH:-}" ]]; then
  mkdir -p "$(dirname "${WEBAPP_TEST_SCREENSHOT_PATH}")"
  cp /tmp/devasophy-all-endpoints.png "${WEBAPP_TEST_SCREENSHOT_PATH}"
fi

echo "Web-app suite passed. Endpoint result: ${RESULT_PATH}"
