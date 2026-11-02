# P15.16 production deployment and live-verification runbook

State: VERIFIED COMPLETE pending exact-head evidence CI confirmation.

## Exact production candidate

Frozen repaired runtime source:

`2a3fed52d4e1f6b2c20a5b0c933cfb422cd56c8b`

Frozen production-safe artifact identity (production environment build of that source):

- releaseId: `2a3fed52d4e1f6b2c20a5b0c933cfb422cd56c8b`
- buildHash: `ac184fba1ec2173826a82c858ad7f1590239d0dafb2df9ee9a3f92bf8e1292aa`
- assetManifestHash: `2bde1be08c57b1383f6d627fb32c44aa3379c5c6b39341b95bb3a3531a1ae2ff`
- schemaCompatibility: `cc-runtime-snapshot-v1`

The build embeds the build environment and its configuration digest into `index.html` and `sw.js`, so the authorized manifest's development-environment identity (`buildHash 2c9edd63…`) differs from the production-environment identity recorded here for the same source. A local rebuild of the candidate source with `COMMAND_CENTER_RELEASE_ID=2a3fed5… COMMAND_CENTER_ENVIRONMENT=production` reproduced the live identity exactly, which proves the deployed artifact is the candidate source under production rules and not a different payload.

This candidate keeps the prior Samsung-focused form repair and the same-origin Vercel rewrite for Supabase Auth only. Browser-origin Auth requests use `/__cc_auth__/...`; private REST/data traffic remains direct to Supabase so private canonical data is not placed behind the PWA same-origin cache. Dedicated regression tests cover both boundaries.

## Production execution

Production was built directly from the exact frozen Git SHA under production environment rules.

Production deployment:

- provider: Vercel
- project: `command-center-preview`
- project id: `prj_gJISweXK7OGvFk1Iy48umKXjFhGX`
- team: Crestven Holdings / `team_kRfj5ZpITaFu83Qggpp3H6cg`
- deployment id: `dpl_CdVrbDQ8d9rw1fnAyom1PNd1wC3m`
- deployment URL: `https://command-center-preview-j891910o8-crestven-holdings.vercel.app`
- stable production domain: `https://command-center-preview-alpha.vercel.app`
- source SHA: `2a3fed52d4e1f6b2c20a5b0c933cfb422cd56c8b`
- target: production
- state: READY / PROMOTED

Production aliases include the stable `command-center-preview-alpha.vercel.app` alias.

Two earlier deployment attempts in the same production operation were superseded and never carried the correct identity: `dpl_EEPCfqbkeRzF6EZfPv5xELzjG4fR` failed because the project build command referenced `build:deploy`, a release-tooling script that does not exist at the candidate commit, and `dpl_SC7NYvD8q29fdREntujzdxVRavGC` served `releaseId "local-unverified"` because the release id environment variable was scoped to only the first build step. Neither attempt changed application source.

## Live verification

Live `/release.json` on the stable production domain exactly matches the identity recorded above, and that identity was independently reproduced by a local production-environment rebuild of the same source.

The live HTML shell carries release id `2a3fed52d4e1f6b2c20a5b0c933cfb422cd56c8b`, environment `production`, and the production configuration digest; it contains no synthetic P15.14 runtime injection. `/__preview__/runtime.json` resolves only to the ordinary SPA shell.

The deployed source contains the same-origin Auth rewrite before the SPA catch-all. A direct `POST /__cc_auth__/token` without an API key returns Supabase's own `401 application/json` response rather than the SPA shell, which proves the Auth rewrite is live in front of the SPA fallback. The exact-head routing regressions prove the browser runtime selects that Auth route on `*.vercel.app` and keeps private REST direct. Real Samsung login success remains P15.17 owner evidence and is not self-certified here.

The live manifest is valid at root scope and references `/assets/command-center-approved-icon-512.png`, which serves `HTTP 200` at the approved size. The live service worker carries the same release id and the verified install/cache/offline/update/two-cache rollback logic. The offline shell and the fixture route both serve their own documents.

All 19 declared routes returned `HTTP 200` with the exact SPA shell on the stable production domain: `/`, `/projects`, `/active`, `/next-up`, `/project/test-project`, `/brain`, `/agency`, `/needs-me`, `/search`, `/automations`, `/personal`, `/finance`, `/social`, `/books`, `/specialists`, `/analytics`, `/settings`, `/settings/security`, `/settings/devices`. The exact-head route-state suite separately verifies all 19 declared route states and fails closed for unknown routes.

Zero runtime errors were observed in the live probes. The Vercel runtime-log endpoint returned an integration error on two attempts and deployment checks returned an empty list, so no log-level error aggregation is claimed.

The full module suite (2353 tests, 0 failures) was reproduced at this evidence head under Node 22.23.4 with `CI=true` and `GITHUB_SHA` set to that head, matching the workflow runtime.

The production runtime remains the authenticated owner-scoped canonical Supabase runtime. The repair required no database migration and no production-data mutation.

## Rollback / containment

The immediately prior Vercel production remains the first rollback target:

- deployment id: `dpl_8Rbi3D27SmZp5Jrwb8NCVkfyTw2N`
- release SHA: `074dc65888149e5d5b0a31a034b6fbc763591000`

The older Vercel productions `dpl_DWvrvK3sCFboMdf8bdHVqNAHQAdq`, `dpl_C4nsZ8yLpVicMf1MoT7Vx8fgWKg1`, and `dpl_BN93YBWTbTDttpXTDWDCwKBVVXp5` and the GitHub Pages fallback remain available as additional containment options.

GitHub Pages baseline:

- URL: `https://jamesmorgan1234.github.io/James-morgan-project-command-center/`
- current protected main SHA: `855a06b43d152df1bc3c7574cc3f584bf1b51892`
- Pages workflow run: `39977771162`
- Pages artifact id: `12512325850`
- previous known-good Pages SHA: `d40a7b2659400481c75f1de87d084b4d6cdce254`

Production deployment did not modify GitHub `main`.

## P15.17 owner acceptance handling

P15.17 is an acceptance-evidence phase, not a permission-to-continue gate. James reported that a fresh production link previously could not complete sign-in after the first form-focused repair, so the phase remained open and the Auth transport path was repaired.

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

P15.16 = `VERIFIED_COMPLETE` once this evidence package passes exact-head CI.

P15.17 = `READY_OWNER_ACCEPTANCE` after that verification; no authorization phrase is required.

P15.18 non-device preparation is complete; the remaining boundary is real owner/device evidence.

P15.1 remains `BLOCKED_SOURCE_ARTIFACT`: the final reconciled individual `CCR-00001` through `CCR-05825` ledger is absent.

## Evidence binding

The guarded P15.1 requalification promoted in `e3f41541b7a0edbcbe1f9ccd5014b77a9c4f84dd` binds the 5852 reviewed rows to this evidence package and leaves zero repository-evidence errors at that head. The production facts above are unchanged by that promotion: it rewrites the reviewed ledger and the every-file review, not the deployed candidate or its release identity.
