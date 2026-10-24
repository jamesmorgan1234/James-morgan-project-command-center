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
  sleep 1
  kill -0 "$SERVER_PID"
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
      const deadline = Date.now() + 10000;
      while (!registration.waiting && Date.now() < deadline) await new Promise((resolve) => setTimeout(resolve, 100));
      if (!registration.waiting) throw new Error('updated worker never entered waiting state');
      const changed = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('controllerchange timeout')), 8000);
        navigator.serviceWorker.addEventListener('controllerchange', () => { clearTimeout(timeout); resolve(); }, { once: true });
      });
      registration.waiting.postMessage({ type: 'ACTIVATE_UPDATE' });
      await changed;
      const keys = (await caches.keys()).filter((key) => key.startsWith('command-center-shell:'));
      if (keys.length < 2 || keys.length > 2) throw new Error(`expected two retained shell caches, saw ${keys.length}`);
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

start_server
"$CHROME" "${COMMON[@]}" --virtual-time-budget=12000 --dump-dom "$BASE/__pwa_lifecycle_probe.html?phase=install" >"$TMP/install.html" 2>"$TMP/install.err"
grep -Fq 'P15_PWA_INSTALL_PASS' "$TMP/install.html"

# Prove the cached Command Center shell is replayed with the origin server absent.
stop_server
set +e
"$CHROME" "${COMMON[@]}" --virtual-time-budget=8000 --dump-dom "$BASE/" >"$TMP/offline.html" 2>"$TMP/offline.err"
OFFLINE_RC=$?
set -e
if [[ $OFFLINE_RC -ne 0 ]]; then
  cat "$TMP/offline.err" >&2
  exit $OFFLINE_RC
fi
grep -Fq '<meta name="application-name" content="Command Center">' "$TMP/offline.html"

# Stage a distinct worker at the same URL. The active worker must keep serving until
# the waiting worker receives the explicit ACTIVATE_UPDATE message.
CURRENT_RELEASE="${GITHUB_SHA:-p15-local}"
UPDATE_RELEASE="${CURRENT_RELEASE}-p15-update"
python3 - "$UPDATE_RELEASE" <<'PY'
from pathlib import Path
import sys
p = Path('dist-web/sw.js')
text = p.read_text()
old = None
for line in text.splitlines():
    if line.startswith('const RELEASE_ID = '):
        old = line
        break
if old is None:
    raise SystemExit('release id line missing from built service worker')
text = text.replace(old, f'const RELEASE_ID = "{sys.argv[1]}";', 1)
p.write_text(text)
PY

start_server
"$CHROME" "${COMMON[@]}" --virtual-time-budget=18000 --dump-dom "$BASE/__pwa_lifecycle_probe.html?phase=update" >"$TMP/update.html" 2>"$TMP/update.err"
grep -Fq 'P15_PWA_UPDATE_PASS' "$TMP/update.html"

echo "P15.14 PWA lifecycle verified: install, offline cache replay, waiting-worker activation, two-cache rollback retention"
