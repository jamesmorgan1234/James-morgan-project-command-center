# P15.18 — Physical Samsung Acceptance Preparation

Status: PREPARED_PENDING_OWNER_AND_DEVICE_EVIDENCE

All non-device preparation is complete. Formal P15.18 execution remains dependent on P15.17 owner acceptance and the real target Samsung device. Hardware-bound evidence must not be inferred from CI, Vercel, GitHub, or desktop/browser automation.

## Locked production subject

- Stable production URL: https://command-center-preview-alpha.vercel.app
- Production deployment: dpl_DWvrvK3sCFboMdf8bdHVqNAHQAdq
- Runtime/source release: 39fb4ab2df17f5ad087e21917b7e2f1b3ede481b
- Build hash: 25fcf841de982da4428cad74080ca7c91e2bb234894a7a942ba889c193aa2972
- Asset manifest hash: a4636b5279685425a782a3c58160a94e6bd56bc52ca20efab691d389a8ee754f
- Schema compatibility: cc-runtime-snapshot-v1

## Physical acceptance matrix

The target Samsung acceptance must verify, on the actual device:

1. Install the production PWA/app surface from the stable production URL.
2. Confirm the exact approved Command Center icon appears correctly after install.
3. Confirm passkey sign-in works using the Samsung/platform authenticator.
4. Confirm fingerprint/device biometric mediation is handled by the platform authenticator without storing biometric templates in Command Center.
5. Confirm lock, session expiry, resume, and re-verification behavior fail closed.
6. Confirm upgrade/update behavior from the older known-good release to the current production release without mixed-version state.
7. Confirm Home, Projects, Active / Live, Next Up, Project Detail, Brain, Agency, Needs Me, Search, Automations, Personal, Finance, Social, Books, Specialists, Analytics, Settings, Security, and Devices are reachable as intended.
8. Confirm Android Back behavior is correct and does not unexpectedly exit or lose state.
9. Confirm scroll position and navigation state behave correctly across representative routes.
10. Confirm offline shell/cache behavior works after a successful online load.
11. Confirm reconnect/resume does not fabricate stale data as current.
12. Confirm visual fidelity at Samsung phone dimensions, including spacing, card geometry, typography, safe-area behavior, and no horizontal overflow.
13. Confirm Brain and Agency core flows remain truthful on-device and do not fabricate provider/activity state.
14. Confirm update activation and rollback/known-good recovery behavior are consistent with the verified PWA lifecycle.
15. Capture any physical-device-only defects precisely enough to reopen the affected phase/gate.

## Operating-order handling

- Browser Use is prohibited for this Command Center workflow and is not required for Samsung acceptance.
- Do not ask James to type an authorization phrase for P15.18.
- Do not claim hardware/passkey/fingerprint/Samsung acceptance without evidence from the real device.
- Do not stop early for CI, deployment, or checklist preparation; those are not the physical acceptance boundary.
- If owner acceptance or Samsung testing finds a defect, reopen only the affected gate/phase, repair, reverify exact head and live production as required, then repeat the affected acceptance checks.

## Genuine remaining boundary

The remaining work that cannot be completed by normal-chat automation is interaction with the actual Samsung device plus James's real functional/visual verdict. No synthetic substitute is allowed.
