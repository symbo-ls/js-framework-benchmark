#!/bin/bash
#
# Benchmark smbls/DOMQL and update the results chart.
#
# Usage:
#   ./bench-smbls.sh                    # benchmark smbls only
#   ./bench-smbls.sh vanillajs          # benchmark smbls + vanillajs
#   ./bench-smbls.sh vanillajs react    # benchmark smbls + vanillajs + react
#   ./bench-smbls.sh --results-only     # skip benchmarks, just rebuild chart
#

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

SMBLS_DIR="frameworks/keyed/smbls"
SERVER_PID=""

cleanup() {
  if [ -n "$SERVER_PID" ]; then
    echo "Stopping server (pid $SERVER_PID)..."
    kill "$SERVER_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

# ── 1. Build smbls ──────────────────────────────────────────────
build_smbls() {
  echo "==> Building smbls..."
  cd "$SCRIPT_DIR/$SMBLS_DIR"
  npm install --silent 2>/dev/null
  npm run build-prod
  cd "$SCRIPT_DIR"
  echo "    Done."
}

# ── 2. Start server ─────────────────────────────────────────────
start_server() {
  if curl -s http://localhost:8080/ > /dev/null 2>&1; then
    echo "==> Server already running on :8080"
    return
  fi
  echo "==> Starting server on :8080..."
  cd "$SCRIPT_DIR/server"
  npm start &
  SERVER_PID=$!
  cd "$SCRIPT_DIR"
  # Wait for server to be ready
  for i in $(seq 1 15); do
    if curl -s http://localhost:8080/ > /dev/null 2>&1; then
      echo "    Server ready."
      return
    fi
    sleep 1
  done
  echo "    ERROR: Server didn't start in 15s" >&2
  exit 1
}

# ── 3. Run benchmarks ───────────────────────────────────────────
run_benchmarks() {
  local frameworks="keyed/smbls"
  for fw in "$@"; do
    frameworks="$frameworks keyed/$fw"
  done

  echo "==> Running benchmarks for: $frameworks"
  cd "$SCRIPT_DIR"
  npm run bench -- --framework $frameworks --runner puppeteer --headless true
  echo "    Benchmarks complete."
}

# ── 4. Build results chart ───────────────────────────────────────
build_results() {
  echo "==> Building results chart..."
  cd "$SCRIPT_DIR/webdriver-ts"
  npm run results
  echo "    Chart built at: webdriver-ts-results/dist/index.html"
}

# ── 5. Open results ─────────────────────────────────────────────
open_results() {
  local url="http://localhost:8080/webdriver-ts-results/dist/index.html"
  echo "==> Opening results: $url"
  if command -v open &>/dev/null; then
    open "$url"
  elif command -v xdg-open &>/dev/null; then
    xdg-open "$url"
  else
    echo "    Open manually: $url"
  fi
}

# ── Main ─────────────────────────────────────────────────────────
if [ "$1" = "--results-only" ]; then
  start_server
  build_results
  open_results
  echo "==> Done! (results only)"
  # Keep server alive so chart loads
  if [ -n "$SERVER_PID" ]; then
    echo "    Press Ctrl+C to stop server."
    wait "$SERVER_PID"
  fi
  exit 0
fi

EXTRA_FRAMEWORKS=("$@")

build_smbls
start_server
run_benchmarks "${EXTRA_FRAMEWORKS[@]}"
build_results
open_results

echo ""
echo "==> All done! Results are open in your browser."
if [ -n "$SERVER_PID" ]; then
  echo "    Press Ctrl+C to stop server."
  wait "$SERVER_PID"
fi
