# Private PWA Update Standard

Use this standard for Command Center and future private installed web/PWA apps unless a project explicitly overrides it.

## Ordinary app updates
- Keep app code, layout, and design updates web-delivered so the installed PWA receives them when it is opened/refreshed.
- Use versioned asset URLs or filenames for changed JavaScript/CSS/resources so stale service-worker/browser caches cannot silently hold the old build.
- Bump the service-worker cache name for production releases that change cached application assets.
- Keep navigation/app-shell requests network-first where practical and retain an offline fallback only for genuine network failure.

## Manifest and theme updates
- Keep the web app manifest path stable. Query-version changes are allowed for cache invalidation; do not move the manifest to a different identity path merely to force an update.
- Keep manifest `id` stable. For Command Center it remains exactly `./`.
- Keep `theme_color`, `background_color`, `display`, and related metadata aligned with the live shell.
- Command Center uses `#000000` for both theme and background so Android/Chrome system surfaces have the best chance of blending black.
- OS navigation/status surfaces remain platform-controlled; never force immersive mode merely to hide Back/Home/Recents.

## App icon updates
- When an icon changes, change the icon URL/metadata in the manifest; never silently replace bytes behind an unchanged manifest icon entry.
- Preserve the exact user-approved launcher artwork. Do not redraw, simplify, reinterpret, or substitute a lower-detail icon when the approved source asset is available.
- Use standards-clean PNG assets that platform icon rasterizers can decode completely; a file that merely has a PNG header is not sufficient.
- Ship both 192×192 and 512×512 `purpose: any` assets and corresponding 192×192 and 512×512 `purpose: maskable` assets for Android/Chrome installation.
- Keep important emblem detail inside the maskable safe area so adaptive icon cropping cannot reduce the approved mark to a blank/black launcher tile.
- Chrome may treat substantial icon changes as identity-sensitive and require a Review app update confirmation.
- There is no normal web API that can force Android to replace an installed launcher icon immediately.
- Do not make uninstall/reinstall the normal update path for a correctly installed, updatable WebAPK.

### Legacy or unbound Android installs
- `chrome://webapks` is the authoritative device-side diagnostic for Chrome-backed WebAPK update state.
- If an installed copy reports `Update Status: Not updatable`, Chromium treats that package as non-updatable through the normal WebAPK update pipeline; the website cannot convert that already-installed Android package in place.
- In that specific case, one final clean install can establish a healthy update-capable WebAPK after the corrected manifest is live.

## Command Center icon release rule
- Keep the manifest identity stable: `id`, `start_url`, and `scope` remain `./`.
- Current approved launcher source is `command-center-approved-icon-512.png`, the exact high-detail orange lightning/node Command Center artwork James approved.
- The Command Center install set includes `command-center-approved-icon-192.png`, `command-center-approved-icon-512.png`, `command-center-approved-icon-maskable-192.png`, and `command-center-approved-icon-maskable-512.png`.
- The current launcher source was normalized into a standards-clean PNG stream after the prior source was found to contain a malformed/truncated image stream that browsers could sometimes display but platform icon tooling could not reliably decode.
- Future icon revisions must advance the icon URL/version metadata while preserving the stable application identity.
- The service worker must treat the manifest and all current launcher assets as network-first/no-store during update checks.

## Mobile behavior
- Preserve normal vertical scrolling and verified Android Back/scroll-restoration behavior.
- Keep the fixed viewport only because James explicitly requested a fixed-scale app screen.
- Do not force immersive/fullscreen mode solely to hide Android Back/Home/Recents controls.
