# P15.16 production deployment and live-verification runbook

State: VERIFIED COMPLETE, pending exact-head evidence CI confirmation.

## Exact production candidate

Frozen repaired runtime source:

`42c50f3093f3f435e53065a877356c317c7ba2f1`

Frozen production-safe artifact identity:

- releaseId: `42c50f3093f3f435e53065a877356c317c7ba2f1`
- buildHash: `3058c8c9c30ac6d95b1c3e31da677ac37ce715ae8b6de7a86cd4f70223f325fd`
- assetManifestHash: `10422fdc2b3f482491f4feb2b5691446605895ca416d945ed52d173b42a8f1eb`
- schemaCompatibility: `cc-runtime-snapshot-v1`

This candidate repairs the P15.17 Samsung owner-sign-in defect by restoring native form validation, preserving username/current-password autofill semantics, adding stable field identifiers, removing forced initial focus, and reporting missing/network/authorization failures truthfully. It also contains a CI-only fix that unsets a malformed hosted-runner D-Bus address before the observed PWA Chrome lifecycle harness starts.

## P15.14 repaired acceptance

Branch-scoped synthetic acceptance Preview:

- deployment id: `dpl_8yUhayFvx98pw5X5rcwoS7LSZLmb`
- URL: `https://command-center-preview-p5sj70mqv-crestven-holdings.vercel.app`
- source SHA: `42c50f3093f3f435e53065a877356c317c7ba2f1`
- state: READY / Preview

The synthetic runtime endpoint returned the explicit synthetic acceptance provider and exact repaired release id. The synthetic fixture was then disabled by returning `COMMAND_CENTER_PREVIEW_ACCEPTANCE` to `0` for the clean-room Preview branch. It was never promoted to production.

Production-safe no-fixture Preview:

- deployment id: `dpl_4cNY1fgUH11DZiURwaJmEt6smvFK`
- URL: `https://command-center-preview-jnhydn724-crestven-holdings.vercel.app`
- source SHA: `42c50f3093f3f435e53065a877356c317c7ba2f1`
- state: READY / Preview

Its `/release.json` matched the frozen production-safe identity above. `/__preview__/runtime.json` returned only the ordinary SPA shell rather than fixture JSON. The repaired compiled owner-auth bundle was present.

Exact-head QA on this repaired source passed typecheck, 184/184 tests, the 676/676 every-file repository audit, zero secret findings, zero violations, protected-icon verification, release-artifact validation, and the observed PWA install/offline/update/two-cache rollback lifecycle.

## Production execution

Because the synthetic Preview was acceptance-only, it was not promoted. Production was rebuilt directly from the exact frozen Git SHA under production environment rules.

Production deployment:

- provider: Vercel
- project: `command-center-preview`
- project id: `prj_gJISweXK7OGvFk1Iy48umKXjFhGX`
- team: Crestven Holdings / `team_kRfj5ZpITaFu83Qggpp3H6cg`
- deployment id: `dpl_BN93YBWTbTDttpXTDWDCwKBVVXp5`
- deployment URL: `https://command-center-preview-kx6z017k3-crestven-holdings.vercel.app`
- stable production domain: `https://command-center-preview-alpha.vercel.app`
- source SHA: `42c50f3093f3f435e53065a877356c317c7ba2f1`
- target: production
- state: READY

Production aliases include the stable `command-center-preview-alpha.vercel.app` alias.

## Live verification

Live `/release.json` on the stable production domain exactly matches the frozen repaired identity.

The live HTML shell carries release id `42c50f3093f3f435e53065a877356c317c7ba2f1`, includes the dedicated owner-auth stylesheet and publishable Supabase client configuration, and contains no synthetic P15.14 runtime injection. `/__preview__/runtime.json` resolves only to the ordinary SPA shell.

The compiled live owner-auth module contains the Samsung-focused repair: form autocomplete enabled, stable email/password IDs, username/current-password autocomplete semantics, required fields, `reportValidity()` before submit, and no forced initial email focus. This prevents the previous empty-password false submission path and restores standards-compatible credential-manager behavior.

The live manifest is valid at root scope and references `/assets/command-center-approved-icon-512.png`. The live service worker carries the same repaired release id and the verified install/cache/offline/update/two-cache rollback logic.

All 19 declared route paths were individually checked on the stable production domain and returned HTTP 200 with the same exact repaired Command Center SPA shell:

1. `/`
2. `/projects`
3. `/active`
4. `/next-up`
5. `/project/test-project`
6. `/brain`
7. `/agency`
8. `/needs-me`
9. `/search`
10. `/automations`
11. `/personal`
12. `/finance`
13. `/social`
14. `/books`
15. `/specialists`
16. `/analytics`
17. `/settings`
18. `/settings/security`
19. `/settings/devices`

Vercel reported zero error/fatal runtime logs for the repaired production deployment in the post-deploy verification window.

The production runtime remains the authenticated owner-scoped canonical Supabase runtime. The repair required no database migration and no production-data mutation.

## Rollback / containment

The immediately prior Vercel production remains the first rollback target:

- deployment id: `dpl_C4nsZ8yLpVicMf1MoT7Vx8fgWKg1`
- release SHA: `26d084f66829052081ef3f9f1792d84b7a6f545f`

The older Vercel production `dpl_DWvrvK3sCFboMdf8bdHVqNAHQAdq` and GitHub Pages fallback remain available as additional containment options.

GitHub Pages baseline:

- URL: `https://jamesmorgan1234.github.io/James-morgan-project-command-center/`
- current protected main SHA: `855a06b43d152df1bc3c7574cc3f584bf1b51892`
- Pages workflow run: `39977771162`
- Pages artifact id: `12512325850`
- previous known-good Pages SHA: `d40a7b2659400481c75f1de87d084b4d6cdce254`

Production deployment did not modify GitHub `main`.

## P15.17 owner acceptance handling

P15.17 is an acceptance-evidence phase, not a permission-to-continue gate. James previously reported the Samsung sign-in defect, which reopened this phase. The defect has now been repaired and production reverified; P15.17 returns to `READY_OWNER_ACCEPTANCE` once the exact-head evidence CI passes.

The next owner step is to retry the stable production surface on the real Samsung device. James may accept in ordinary language or report any remaining defect. No exact wording is required. CI must not fabricate or self-certify owner acceptance.

## P15.18 Samsung acceptance preparation

All non-device preparation remains complete. Formal P15.18 execution depends on successful P15.17 owner acceptance and the real target Samsung device.

Physical acceptance matrix:

1. Install/open the production PWA/app surface from the stable URL.
2. Confirm the exact approved Command Center icon.
3. Confirm saved-credential/password-manager behavior and owner sign-in on Samsung.
4. Confirm passkey sign-in through the Samsung/platform authenticator when that flow is exercised.
5. Confirm fingerprint/device biometric mediation remains platform-owned and Command Center never stores biometric templates.
6. Confirm lock/session expiry/resume/fresh verification fail closed.
7. Confirm update behavior from the older known-good release to the current release without mixed-version state.
8. Confirm all 19 declared routes are reachable as intended on-device.
9. Confirm Android Back behavior.
10. Confirm scroll position and navigation-state behavior.
11. Confirm offline shell/cache behavior after a successful online load.
12. Confirm reconnect/resume does not present stale data as current.
13. Confirm visual fidelity at Samsung phone dimensions, safe areas, and no horizontal overflow.
14. Confirm Brain and Agency core flows remain truthful on-device.
15. Capture any physical-device-only defects precisely enough to reopen the affected phase/gate.

Hardware/passkey/fingerprint/Samsung evidence must not be inferred from CI, Vercel, GitHub, or desktop automation.

P15.18 preparation state: `PREPARED_PENDING_OWNER_AND_DEVICE_EVIDENCE`.

## Phase result

P15.16 = `VERIFIED_COMPLETE` once this repaired evidence package passes exact-head CI.

P15.17 = `READY_OWNER_ACCEPTANCE` after that verification; no authorization phrase is required.

P15.18 non-device preparation is complete; the remaining boundary is real owner/device evidence.

P15.1 remains `BLOCKED_SOURCE_ARTIFACT`: the final reconciled individual `CCR-00001` through `CCR-05825` ledger is absent.
