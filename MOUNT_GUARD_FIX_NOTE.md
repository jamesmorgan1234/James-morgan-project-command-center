# Rebuilt Renderer Mount Guard Fix

Observed phone behavior: the rebuilt Command Center screen appeared briefly, then after the watchdog interval it was replaced by a `Needs refresh` recovery card. Pressing Retry produced `The approved Command Center renderer returned without mounting a screen.`

Root cause: `command-center-approved-mount-guard.js` still recognized only legacy approved-renderer class names such as `.cc-approved-home-grid`, while PR #65 rebuilt normal screens with classes such as `.cc-screen-home-grid`, `.cc-screen-project-list`, `.cc-screen-next-list`, `.cc-screen-active-list`, `.cc-screen-project-hero`, and `.cc-screen-revenue-hero`.

The renderer was mounting successfully. The stale watchdog falsely classified the mounted rebuilt screen as missing and then overwrote it with its recovery UI.

Fix:
- Centralize mounted-screen detection around the rebuilt screen classes while retaining compatibility with older approved classes.
- Stop the watchdog immediately after the `command-center:approved-rendered` event when a rebuilt screen is present.
- Load the corrected mount guard as `command-center-approved-mount-guard.js?v=2` so an installed PWA cannot reuse the cached v1 guard.
- Add a dedicated regression test covering every rebuilt normal-use screen type.
