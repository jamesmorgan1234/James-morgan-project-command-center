#!/usr/bin/env bash
set -euo pipefail

# GitHub-hosted Ubuntu runners can expose a malformed DBUS_SESSION_BUS_ADDRESS
# that prevents headless Chrome from finishing startup and writing
# DevToolsActivePort. The PWA lifecycle harness does not use a desktop D-Bus
# session, so remove that inherited runner-only value before launching Chrome.
unset DBUS_SESSION_BUS_ADDRESS || true

node scripts/category15-pwa-lifecycle.mjs
