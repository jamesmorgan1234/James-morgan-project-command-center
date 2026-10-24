#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

CHROME="$(command -v google-chrome || command -v chromium || command -v chromium-browser || true)"
if [[ -z "$CHROME" ]]; then
  echo "No Chrome/Chromium available for P15.14 lifecycle acceptance" >&2
  exit 1
fi
if [[ ! -d dist-web ]]; then
  echo "dist-web is missing; run npm run build first" >&2
  exit 1
fi

PORT="${CATEGORY15_PWA_PORT:-4187}"
BASE="http://127.0.0.1:${PORT}"
PROFILE="$(mktemp -d)"
TMP="$(mktemp -d)"
SERVER_PID=""
ORIGINAL_SW="$(cat dist-web/sw.js)"

cleanup() {
  if [[ -n "$SERVER_PID" ]]; then kill "$SERVER_PID" 2>/dev/null || true; fi
  printf '%s' "$ORIGINAL_SW" > dist-web/sw.js
  rm -f dist-web/__pwa_lifecycle_probe.html
  rm -rf "$PROFILE" "$TMP"
}
trap cleanup EXIT

start_server() {
  python3 -m http.server "$PORT" --directory dist-web >"$TMP/http.log" 2>&1 &
  SERVER_PID=$!
  for _ in $(seq 1 40); do
    if curl -fsS "$BASE/index.html" >/dev/null 2>&1; then return 0; fi
    if ! kill -0 "$SERVER_PID" 2>/dev/null; then
      echo "P15 PWA test server exited before readiness" >&2
      cat "$TMP/http.log" >&2 || true
      return 1
    fi
    sleep 0.25
  done
  echo "P15 PWA test server did not become ready" >&2
  cat "$TMP/http.log" >&2 || true
  return 1
}

stop_server() {
  if [[ -n "$SERVER_PID" ]]; then
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
    SERVER_PID=""
  fi
}

cat > dist-web/__pwa_lifecycle_probe.html <<'HTML'
<!doctype html>
<meta charset="utf-8">
<title>P15 PWA lifecycle probe</title>
<pre id="result">PENDING</pre>
<script>
(async () => {
  const out = document.querySelector('#result');
  const phase = new URL(location.href).searchParams.get('phase');
  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;
    if (phase === 'install') {
      const keys = await caches.keys();
      if (!registration.active || !keys.some((key) => key.startsWith('command-center-shell:'))) throw new Error('initial worker/cache missing');
      out.textContent = 'P15_PWA_INSTALL_PASS';
      return;
    }
    if (phase === 'update') {
      await registration.update();
      const deadline = Date.now() + 15000;
      while (!registration.waiting && Date.now() < deadline) await new Promise((resolve) => setTimeout(resolve, 100));
      if (!registration.waiting) throw new Error('updated worker never entered waiting state');
      const changed = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('controllerchange timeout')), 12000);
        navigator.serviceWorker.addEventListener('controllerchange', () => { clearTimeout(timeout); resolve(); }, { once: true });
      });
      registration.waiting.postMessage({ type: 'ACTIVATE_UPDATE' });
      await changed;
      const keys = (await caches.keys()).filter((key) => key.startsWith('command-center-shell:'));
      if (keys.length !== 2) throw new Error(`expected two retained shell caches, saw ${keys.length}`);
      out.textContent = 'P15_PWA_UPDATE_PASS';
      return;
    }
    throw new Error('unknown phase');
  } catch (error) {
    out.textContent = `P15_PWA_FAIL:${error instanceof Error ? error.message : String(error)}`;
  }
})();
</script>
HTML

COMMON=(--headless=new --no-sandbox --disable-gpu --no-first-run --no-default-browser-check --user-data-dir="$PROFILE")

show_failure() {
  local label="$1" out="$2" err="$3"
  echo "P15 PWA ${label} probe failed after bounded retries" >&2
  echo "--- chrome stderr ---" >&2
  cat "$err" >&2 2>/dev/null || true
  echo "--- dumped DOM tail ---" >&2
  tail -c 12000 "$out" >&2 2>/dev/null || true
  echo >&2
  echo "--- http server log ---" >&2
  cat "$TMP/http.log" >&2 2>/dev/null || true
}

run_online_probe() {
  local phase="$1"
  local expected="$2"
  local budget="$3"
  local out="$TMP/${phase}.html"
  local err="$TMP/${phase}.err"
  for attempt in 1 2 3; do
    : >"$out"; : >"$err"
    set +e
    "$CHROME" "${COMMON[@]}" --virtual-time-budget="$budget" --dump-dom "$BASE/__pwa_lifecycle_probe.html?phase=$phase&attempt=$attempt" >"$out" 2>"$err"
    local rc=$?
    set -e
    if [[ $rc -eq 0 ]] && grep -Fq "$expected" "$out"; then return 0; fi
    sleep "$attempt"
  done
  show_failure "$phase" "$out" "$err"
  return 1
}

run_offline_probe() {
  local out="$TMP/offline.html"
  local err="$TMP/offline.err"
  for attempt in 1 2 3; do
    : >"$out"; : >"$err"
    set +e
    "$CHROME" "${COMMON[@]}" --virtual-time-budget=12000 --dump-dom "$BASE/?offline_attempt=$attempt" >"$out" 2>"$err"
    local rc=$?
    set -e
    if [[ $rc -eq 0 ]] && grep -Fq '<meta name="application-name" content="Command Center">' "$out"; then return 0; fi
    sleep "$attempt"
  done
  show_failure "offline" "$out" "$err"
  return 1
}

stage_update_release() {
  local update_release="$1"
  printf '%s' "$ORIGINAL_SW" > dist-web/sw.js
  python3 - "$update_release" <<'PY'
from pathlib import Path
import sys
p = Path('dist-web/sw.js')
text = p.read_text()
old = next((line for line in text.splitlines() if line.startswith('const RELEASE_ID = ')), None)
if old is None:
    raise SystemExit('release id line missing from built service worker')
text = text.replace(old, f'const RELEASE_ID = "{sys.argv[1]}";', 1)
p.write_text(text)
PY
}

start_server
run_online_probe install P15_PWA_INSTALL_PASS 18000

# Prove the cached Command Center shell is replayed with the origin server absent.
stop_server
run_offline_probe

# Each bounded update attempt stages a distinct worker. This preserves the actual
# waiting-worker -> explicit ACTIVATE_UPDATE -> controllerchange proof even if a
# prior headless Chrome dump exits after activation but before printing the marker.
start_server
CURRENT_RELEASE="${GITHUB_SHA:-p15-local}"
update_ok=false
for attempt in 1 2 3; do
  stage_update_release "${CURRENT_RELEASE}-p15-update-${attempt}"
  if run_online_probe update P15_PWA_UPDATE_PASS 24000; then
    update_ok=true
    break
  fi
  sleep "$attempt"
done
if [[ "$update_ok" != true ]]; then
  echo "P15 PWA update activation could not be verified" >&2
  exit 1
fi

echo "P15.14 PWA lifecycle verified: install, offline cache replay, waiting-worker activation, two-cache rollback retention"
