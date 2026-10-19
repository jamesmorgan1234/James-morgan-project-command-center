# Private PWA Update Standard

Use this standard for Command Center and future private installed web/PWA apps unless a project explicitly overrides it.

## Ordinary app updates

- Keep app code, layout, and design updates web-delivered so the installed PWA receives them when it is opened/refreshed.
- Use versioned asset URLs or filenames for changed JavaScript/CSS/resources so stale service-worker/browser caches cannot silently hold the old build.
- Bump the service-worker cache name for production releases that change cached application assets.
- Keep navigation/app-shell requests network-first where practical and retain an offline fallback only for genuine network failure.

## Manifest and theme updates

- Keep manifest `theme_color`, `background_color`, `display`, and related metadata aligned with the live app shell.
- Version the manifest URL when making significant metadata changes so the browser has a clear new resource to retrieve.
- Use a dark `theme-color` plus `color-scheme: dark` for dark apps so browser/system areas blend with the app where Android/Chrome permits it.

## App icon updates

- When an icon changes, use a new versioned icon filename instead of overwriting an old filename in place.
- Update the manifest to reference the new `any` and `maskable` icon resources.
- Do not make uninstall/reinstall the normal update path.
- Allow Chrome/Android/WebAPK time to refresh installed metadata first.
- If the platform requires user approval for a significant identity/icon change, prefer one simple Review/Update action.
- Only use uninstall/reinstall/re-add-to-home-screen as a last resort when the platform genuinely cannot refresh the installed metadata.

## Mobile behavior

- Preserve normal scrolling.
- Fixed-scale app screens may lock the viewport to scale 1 when explicitly requested, while acknowledging that browser/OS accessibility behavior may override page-level restrictions.
- Do not force immersive/fullscreen mode solely to hide Android Back/Home/Recents controls unless the product requirement explicitly calls for it.
