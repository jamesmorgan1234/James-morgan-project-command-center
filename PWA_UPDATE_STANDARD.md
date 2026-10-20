# Private PWA Update Standard

Use this standard for Command Center and future private installed web/PWA apps unless a project explicitly overrides it.

## Ordinary app updates

- Keep app code, layout, and design updates web-delivered so the installed PWA receives them when it is opened/refreshed.
- Use versioned asset URLs or filenames for changed JavaScript/CSS/resources so stale service-worker/browser caches cannot silently hold the old build.
- Bump the service-worker cache name for production releases that change cached application assets.
- Keep navigation/app-shell requests network-first where practical and retain an offline fallback only for genuine network failure.

## Manifest and theme updates

- Keep the web app manifest URL stable. Do not rename or move the manifest merely to force an update; Chrome may treat a changed manifest location as a different update path.
- Keep the manifest `id` stable. For Command Center it remains exactly `./` so existing proper installs keep the same application identity.
- Keep manifest `theme_color`, `background_color`, `display`, and related metadata aligned with the live app shell.
- Use a dark `theme-color` plus `color-scheme: dark` for dark apps so browser/system areas blend with the app where Android/Chrome permits it.
- Treat OS navigation/status surfaces as platform-controlled. If the page itself is dark and the manifest/meta theme colors are correct, a remaining white Android system navigation area may not be controllable from normal PWA CSS/manifest settings. Do not force immersive/fullscreen mode solely to hide it.

## App icon updates

- When an icon changes, change the icon URL or icon metadata in the manifest. Prefer a new versioned filename; a versioned query URL is acceptable when the underlying asset must remain shared.
- Update the manifest `icons` field to reference distinct versioned `any` and `maskable` icon URLs while keeping the manifest `id`, `start_url`, scope, and manifest location stable.
- Chrome 144+ treats unchanged manifest icon entries as immutable and does not redownload them. A changed icon URL or metadata is therefore mandatory for a predictable icon update attempt.
- Small visual icon changes may be applied silently. Larger identity/icon changes may require Chrome's user-facing Review app update confirmation. The web app cannot bypass that security decision.
- There is no normal web API that can force Android to replace an installed launcher icon immediately. Launching the PWA lets Chrome re-check the matching manifest; WebAPK installation of changed metadata can still be asynchronous.
- Do not make uninstall/reinstall the normal update path for a correctly installed, updatable WebAPK.
- Prefer one simple platform Review/Update action when Chrome/Android requires confirmation.

### Legacy or unbound Android installs

- `chrome://webapks` is the authoritative device-side diagnostic for Chrome-backed WebAPK update state.
- If an installed copy reports `Update Status: Not updatable`, Chromium treats that package as an unbound/non-updatable WebAPK for the manual update pipeline. A website or service worker cannot convert that already-installed Android package into an updatable bound WebAPK in place.
- In that specific legacy/unbound case, one final remove/reinstall may be required after the corrected manifest/update architecture is live. The purpose of that reinstall is to establish a proper update-capable installation so future ordinary application updates and supported icon metadata updates do not require reinstalling again.
- Never promise that a large future icon redesign will be completely silent: Chrome may require the user to review identity-sensitive icon changes even on a healthy WebAPK.

## Command Center icon release rule

- Keep `manifest.webmanifest?v=3` as the current linked manifest location unless a separate migration is intentionally designed.
- Keep manifest `id`, `start_url`, and `scope` unchanged.
- For the orange lightning identity, manifest icon entries use versioned URLs. The current candidate is `command-center-icon-v4.svg?icon=5-any` and `command-center-icon-v4.svg?icon=5-maskable`.
- Future icon revisions must advance those URLs again (`icon=6-*`, `icon=7-*`, or new versioned filenames) instead of replacing bytes behind an unchanged URL.
- The service worker must treat the manifest and launcher-icon resource as network-first/no-store during update checks so stale cache state cannot hide fresh manifest metadata from the browser.

## Mobile behavior

- Preserve normal scrolling.
- Fixed-scale app screens may lock the viewport to scale 1 when explicitly requested, while acknowledging that browser/OS accessibility behavior may override page-level restrictions.
- Do not force immersive/fullscreen mode solely to hide Android Back/Home/Recents controls unless the product requirement explicitly calls for it.
