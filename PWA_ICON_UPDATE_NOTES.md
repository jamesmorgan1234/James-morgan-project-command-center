# Command Center icon update pipeline

Goal: make future installed-app icon revisions update through the normal PWA/WebAPK metadata update path instead of treating uninstall/reinstall as the normal release workflow.

## Current release candidate

- Preserve app identity: `id`, `start_url`, and `scope` remain `./`.
- Preserve the existing linked manifest location: `./manifest.webmanifest?v=3`.
- Advance launcher icon metadata URLs to:
  - `command-center-icon-v4.svg?icon=5-any`
  - `command-center-icon-v4.svg?icon=5-maskable`
- Treat the manifest and orange launcher asset as network-first/no-store inside the service worker so a stale app-shell cache cannot hide new icon metadata.
- Bump the application cache to v41.
- Add automated QA that fails if future releases accidentally reuse unversioned launcher-icon metadata, change the installed app identity, or remove the network-first manifest/icon path.

## Android limitation already observed on James's current install

James's current installed Command Center copy previously showed `Update Status: Not updatable` in `chrome://webapks` with unset/epoch update timestamps. Chromium exposes that state for an installed package that is not updateable through Chrome's normal WebAPK update control.

This release cannot rewrite that already-installed Android package from the website. After this release is live, test the existing install once. If it remains `Not updatable`, one final clean install is the device-side recovery step. The purpose of that one-time recovery is to establish an update-capable WebAPK under the corrected stable identity/versioned-icon architecture. Future icon releases must advance the icon URL again and should not require reinstalling a healthy WebAPK, although Chrome can still require the user to review a substantial icon/identity change.

## Future icon release procedure

1. Keep manifest URL, `id`, `start_url`, and `scope` stable.
2. Publish the new icon asset.
3. Change the manifest icon URL/metadata to a never-before-used version.
4. Bump the service-worker cache and cache the new URL.
5. Run PWA icon update QA plus mobile-navigation and scope-progress regression QA.
6. Release normally.
7. On Android, open the installed app so Chrome can process the manifest update. If Chrome considers the icon change identity-sensitive, the user may need to accept Review app update; reinstall is not the standard path.
