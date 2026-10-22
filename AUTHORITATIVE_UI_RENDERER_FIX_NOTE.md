# Authoritative UI Renderer Fix

Observed production failure evidence: the live phone PWA, phone website, and desktop website all rendered the legacy Command Center dashboard stack instead of the approved screenshot-style app surface, even after a full clean uninstall/site-data reset.

Root architecture issue: `command-center-approved-ui.js` and its companion layers were being injected indirectly from `command-center-agent-mode-completion.js`, after the legacy renderer stack had already loaded. Production correctness therefore depended on a later enhancement layer successfully replacing/hiding the legacy surface.

Fix: `app-config.js` now loads the approved mobile-first/artwork/approved-ui/precise-progress/navigation/work-boundary layers directly, before the legacy V4/V6 renderers. The Agent completion layer remains only as a duplicate-safe fallback and legacy-Agent retirement layer.

Acceptance rule: the approved Command Center surface is the primary renderer in normal authenticated use. Legacy/admin UI may be reached only through About/advanced mode and must not be the initial production interface.
