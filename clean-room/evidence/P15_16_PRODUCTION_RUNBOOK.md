# P15.16 production deployment and live-verification runbook

State: VERIFIED COMPLETE, pending exact-head evidence CI confirmation.

## Exact production candidate

Frozen repaired runtime source:

`9b6d136447def58ad8a4df3f05261f7bd6b7ef80`

Frozen production-safe artifact identity:

- releaseId: `9b6d136447def58ad8a4df3f05261f7bd6b7ef80`
- buildHash: `72918429817b12957178f4685f84b6a67ac895d5972517e1dc5b4969cdf301f3`
- assetManifestHash: `b9a76bb84da35231ac7dfc72d430b8372becaf27158dfa3a1fd1e352f00eb2a7`
- schemaCompatibility: `cc-runtime-snapshot-v1`

This candidate keeps the prior Samsung-focused form repair and adds a same-origin Vercel rewrite for Supabase Auth only. Browser-origin Auth requests use `/__cc_auth__/...`; private REST/data traffic remains direct to Supabase so private canonical data is not placed behind the PWA same-origin cache. Dedicated regression tests cover both boundaries.

## P15.14 repaired acceptance

Production-safe no-fixture Preview:

- deployment id: `dpl_9GTPfksYY5En25ne6XdxFbRTQDHW`
- URL: `https://command-center-preview-k53dhma4y-crestven-holdings.vercel.app`
- source SHA: `9b6d136447def58ad8a4df3f05261f7bd6b7ef80`
- state: READY / Preview

The branch-scoped `COMMAND_CENTER_PREVIEW_ACCEPTANCE` flag remained `0`; `/__preview__/runtime.json` was not a synthetic runtime in the production-safe path.

Exact-head QA on this repaired source passed typecheck, 186/186 tests, the 677/677 every-file repository audit, zero secret findings, zero violations, protected-icon verification, release-artifact validation, and the observed PWA install/offline/update/two-cache rollback lifecycle. The suite includes the Vercel-origin same-origin Auth routing test and the non-Vercel/direct Auth routing test.

## Production execution

Production was built directly from the exact frozen Git SHA under production environment rules.

Production deployment:

- provider: Vercel
- project: `command-center-preview`
- project id: `prj_gJISweXK7OGvFk1Iy48umKXjFhGX`
- team: Crestven Holdings / `team_kRfj5ZpITaFu83Qggpp3H6cg`
- deployment id: `dpl_F7RFaYTTuVTxrYgCabp5XpZS3qth`
- deployment URL: `https://command-center-preview-htgnl9tcy-crestven-holdings.vercel.app`
- stable production domain: `https://command-center-preview-alpha.vercel.app`
- source SHA: `9b6d136447def58ad8a4df3f05261f7bd6b7ef80`
- target: production
- state: READY

Production aliases include the stable `command-center-preview-alpha.vercel.app` alias.

## Live verification

Live `/release.json` on the stable production domain exactly matches the frozen repaired identity.

The live HTML shell carries release id `9b6d136447def58ad8a4df3f05261f7bd6b7ef80`, includes the dedicated owner-auth stylesheet and publishable Supabase client configuration, and contains no synthetic P15.14 runtime injection. `/__preview__/runtime.json` resolves only to the ordinary SPA shell.

The deployed source contains the same-origin Auth rewrite before the SPA catch-all. The exact-head routing regressions prove the browser runtime selects that Auth route on `*.vercel.app` and keeps private REST direct. Real Samsung login success remains P15.17 owner evidence and is not self-certified here.

The live manifest is valid at root scope and references `/assets/command-center-approved-icon-512.png`. The live service worker carries the same repaired release id and the verified install/cache/offline/update/two-cache rollback logic.

Representative live route checks on the stable production domain returned HTTP 200 with the exact repaired SPA shell for `/`, `/projects`, `/books`, `/brain`, `/agency`, `/settings/security`, and `/settings/devices`. The exact-head route-state suite separately verifies all 19 declared route states and fails closed for unknown routes.

Vercel reported zero runtime-error clusters in the post-deploy verification window.

The production runtime remains the authenticated owner-scoped canonical Supabase runtime. The repair required no database migration and no production-data mutation.

## Rollback / containment

The immediately prior Vercel production remains the first rollback target:

- deployment id: `dpl_BN93YBWTbTDttpXTDWDCwKBVVXp5`
- release SHA: `42c50f3093f3f435e53065a877356c317c7ba2f1`

The older Vercel production `dpl_C4nsZ8yLpVicMf1MoT7Vx8fgWKg1`, the older deployment `dpl_DWvrvK3sCFboMdf8bdHVqNAHQAdq`, and GitHub Pages fallback remain available as additional containment options.

GitHub Pages baseline:

- URL: `https://jamesmorgan1234.github.io/James-morgan-project-command-center/`
- current protected main SHA: `855a06b43d152df1bc3c7574cc3f584bf1b51892`
- Pages workflow run: `39977771162`
- Pages artifact id: `12512325850`
- previous known-good Pages SHA: `d40a7b2659400481c75f1de87d084b4d6cdce254`

Production deployment did not modify GitHub `main`.

## P15.17 owner acceptance handling

P15.17 is an acceptance-evidence phase, not a permission-to-continue gate. James reported that the fresh production link still could not complete sign-in after the first form-focused repair, so the phase remained open and the Auth transport path was repaired.

The next owner step is to retry the stable production URL in Chrome on the real Samsung device before installing the PWA. If sign-in succeeds, proceed to clean install and the rest of the physical-device matrix. If it fails, capture the exact message/screen and reopen the affected Auth path. No exact wording is required. CI must not fabricate or self-certify owner acceptance.

## P15.18 Samsung acceptance preparation

All non-device preparation remains complete. Formal P15.18 execution depends on successful P15.17 owner acceptance and the real target Samsung device.

Physical acceptance matrix:

1. Open and successfully authenticate to the stable production URL in Chrome before installation.
2. Install/open the production PWA/app surface from the stable URL.
3. Confirm the exact approved Command Center icon.
4. Confirm saved-credential/password-manager behavior and owner sign-in on Samsung.
5. Confirm passkey sign-in through the Samsung/platform authenticator when that flow is exercised.
6. Confirm fingerprint/device biometric mediation remains platform-owned and Command Center never stores biometric templates.
7. Confirm lock/session expiry/resume/fresh verification fail closed.
8. Confirm update behavior without mixed-version state.
9. Confirm all 19 declared routes are reachable as intended on-device.
10. Confirm Android Back behavior.
11. Confirm scroll position and navigation-state behavior.
12. Confirm offline shell/cache behavior after a successful online load.
13. Confirm reconnect/resume does not present stale data as current.
14. Confirm visual fidelity at Samsung phone dimensions, safe areas, and no horizontal overflow.
15. Confirm Brain and Agency core flows remain truthful on-device.
16. Capture any physical-device-only defects precisely enough to reopen the affected phase/gate.

Hardware/passkey/fingerprint/Samsung evidence must not be inferred from CI, Vercel, GitHub, or desktop automation.

P15.18 preparation state: `PREPARED_PENDING_OWNER_AND_DEVICE_EVIDENCE`.

## Phase result

P15.16 = `VERIFIED_COMPLETE` once this repaired evidence package passes exact-head CI.

P15.17 = `READY_OWNER_ACCEPTANCE` after that verification; no authorization phrase is required.

P15.18 non-device preparation is complete; the remaining boundary is real owner/device evidence.

P15.1 remains `BLOCKED_SOURCE_ARTIFACT`: the final reconciled individual `CCR-00001` through `CCR-05825` ledger is absent.
