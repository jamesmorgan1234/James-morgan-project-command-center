# Private PWA Update Standard

Use this standard for Command Center and future private installed web/PWA apps unless a project explicitly overrides it.

## Ordinary app updates

- Keep app code, layout, and design updates web-delivered so the installed PWA receives them when it is opened/refreshed.
- Use versioned asset URLs or filenames for changed JavaScript/CSS/resources so stale service-worker/browser caches cannot silently hold the old build.
- Bump the service-worker cache name for production releases that change cached application assets.
- Keep navigation/app-shell requests network-first where practical and retain an offline fallback only for genuine network failure.

## Manifest and theme updates

- Keep the web app manifest URL stable. Do not rename or move the manifest merely to force an update; Chrome may treat a changed manifest location as a different update path.
- Keep manifest `theme_color`, `background_color`, `display`, and related metadata aligned with the live app shell.
- Use a dark `theme-color` plus `color-scheme: dark` for dark apps so browser/system areas blend with the app where Android/Chrome permits it.
- Treat OS navigation/status surfaces as platform-controlled. If the page itself is dark and the manifest/meta theme colors are correct, a remaining white Android system navigation area may not be controllable from normal PWA CSS/manifest settings. Do not force immersive/fullscreen mode solely to hide it.

## App icon updates

- When an icon changes, use a new versioned icon filename instead of overwriting an old filename in place.
- Update the manifest `icons` field to reference the new `any` and `maskable` icon URLs while keeping the manifest `id`, `start_url`, scope, and manifest location stable.
- On current Chrome for Android, changing the icon URL/metadata is the standards-compliant trigger for an installed WebAPK icon refresh. Chrome may automatically apply a small visual change or may show a simple Review app update/Update confirmation for a larger identity/icon change.
- There is no normal web API that can force Android to replace an installed launcher icon immediately. Launching the PWA lets Chrome re-check the manifest; the installed metadata update may still be asynchronous.
- Do not make uninstall/reinstall the normal update path.
- Prefer one simple platform Review/Update action when Chrome/Android requires confirmation.
- Only use uninstall/reinstall/re-add-to-home-screen as a last resort when the platform genuinely cannot refresh the installed metadata.

## Mobile behavior

- Preserve normal scrolling.
- Fixed-scale app screens may lock the viewport to scale 1 when explicitly requested, while acknowledging that browser/OS accessibility behavior may override page-level restrictions.
- Do not force immersive/fullscreen mode solely to hide Android Back/Home/Recents controls unless the product requirement explicitly calls for it.
