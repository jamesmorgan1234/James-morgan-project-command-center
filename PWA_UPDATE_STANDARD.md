# Private PWA Update Standard

Use this standard for Command Center and future private installed web/PWA apps unless a project explicitly overrides it.

## Ordinary app updates
- Keep app code, layout, and design updates web-delivered so the installed PWA receives them when it is opened/refreshed.
- Use versioned asset URLs or filenames for changed JavaScript/CSS/resources so stale service-worker/browser caches cannot silently hold the old build.
- Bump the service-worker cache name for production releases that change cached application assets.
- Keep navigation/app-shell requests network-first where practical and retain an offline fallback only for genuine network failure.

## Manifest and theme updates
- Keep the web app manifest URL stable. Do not rename or move the manifest merely to force an update.
- Keep manifest `id` stable. For Command Center it remains exactly `./`.
- Keep `theme_color`, `background_color`, `display`, and related metadata aligned with the live shell.
- Command Center uses `#000000` for both theme and background so Android/Chrome system surfaces have the best chance of blending black.
- OS navigation/status surfaces remain platform-controlled; never force immersive mode merely to hide Back/Home/Recents.

## App icon updates
- When an icon changes, change the icon URL/filename in the manifest; never silently replace bytes behind an unchanged manifest icon entry.
- Use a self-contained launcher asset; avoid nested raster/data-URI dependencies that can fail in platform icon rasterizers.
- Chrome may treat substantial icon changes as identity-sensitive and require a Review app update confirmation.
- There is no normal web API that can force Android to replace an installed launcher icon immediately.
- Do not make uninstall/reinstall the normal update path for a correctly installed, updatable WebAPK.

### Legacy or unbound Android installs
- `chrome://webapks` is the authoritative device-side diagnostic for Chrome-backed WebAPK update state.
- If an installed copy reports `Update Status: Not updatable`, Chromium treats that package as non-updatable through the normal WebAPK update pipeline; the website cannot convert that already-installed Android package in place.
- In that specific case, one final clean install can establish a healthy update-capable WebAPK after the corrected manifest is live.

## Command Center icon release rule
- Keep `manifest.webmanifest?v=3` as the linked manifest location.
- Keep manifest `id`, `start_url`, and `scope` unchanged.
- Current approved launcher assets are `command-center-icon-v5.svg` and `command-center-icon-v5-maskable.svg`.
- Future icon revisions must advance to new versioned filenames (v6, v7, and so on).
- The service worker must treat the manifest and current launcher assets as network-first/no-store during update checks.

## Mobile behavior
- Preserve normal vertical scrolling and verified Android Back/scroll-restoration behavior.
- Keep the fixed viewport only because James explicitly requested a fixed-scale app screen.
- Do not force immersive/fullscreen mode solely to hide Android Back/Home/Recents controls.
