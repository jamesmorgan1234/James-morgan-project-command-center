#!/usr/bin/env bash
set -euo pipefail

# Headless Chrome on hosted runners does not need a desktop D-Bus session.
# Either inherited bus address can be malformed; keep the browser proof real.
unset DBUS_SESSION_BUS_ADDRESS DBUS_SYSTEM_BUS_ADDRESS || true

# Retry *only* an early DevTools startup failure once with a fresh temporary
# Chrome profile. A failed lifecycle assertion, missing real browser, or a
# second failure remains an actual CI failure.
startup_log="$(mktemp)"
trap 'rm -f "$startup_log"' EXIT
if node scripts/category15-pwa-lifecycle.mjs >"$startup_log" 2>&1; then
  cat "$startup_log"
  exit 0
fi
cat "$startup_log" >&2
if ! grep -Fq 'Chrome DevTools endpoint did not become ready' "$startup_log"; then
  exit 1
fi
printf '%s\n' 'Retrying once after headless Chrome startup failure; real-browser PWA proof is still required.' >&2
sleep 2
node scripts/category15-pwa-lifecycle.mjs
