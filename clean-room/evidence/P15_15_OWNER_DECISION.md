# P15.15 owner decision

## Owner direction

The owner has repeatedly authorized Command Center production deployment/modification and explicitly corrected the prior false authorization boundary. The newest controlling instruction is to continue through deployment and testing without requiring another authorization phrase.

This supersedes the earlier temporary no-production-mutation constraint for the authorized Command Center release path. It does not authorize paid services, unrelated projects, or unrelated destructive changes.

During P15.17 physical owner acceptance, James reported a real Samsung sign-in defect: the saved-credential prompt did not appear and the form could submit with an empty password because native validation had been disabled. That defect reopened the relevant release gates. The repair restored browser validation/autofill compatibility and stabilized the GitHub-hosted Chrome PWA harness without changing production data.

## Frozen repaired runtime candidate

Exact repaired clean-room runtime source:

`42c50f3093f3f435e53065a877356c317c7ba2f1`

Production-safe build identity from the no-fixture Preview and production build:

- releaseId: `42c50f3093f3f435e53065a877356c317c7ba2f1`
- buildHash: `3058c8c9c30ac6d95b1c3e31da677ac37ce715ae8b6de7a86cd4f70223f325fd`
- assetManifestHash: `10422fdc2b3f482491f4feb2b5691446605895ca416d945ed52d173b42a8f1eb`
- schemaCompatibility: `cc-runtime-snapshot-v1`

The repaired source includes the owner sign-in correction and the CI-only PWA Chrome startup stabilization. All later changes through the Category 15 evidence head are acceptance/release evidence only; no application runtime source changes are permitted after this frozen candidate.

## Fresh P15.14 synthetic acceptance Preview

The repaired runtime was exercised on a new branch-scoped synthetic acceptance Preview:

- deployment: `dpl_8yUhayFvx98pw5X5rcwoS7LSZLmb`
- URL: `command-center-preview-p5sj70mqv-crestven-holdings.vercel.app`
- source SHA: `42c50f3093f3f435e53065a877356c317c7ba2f1`
- state: READY / Preview

The fixture endpoint returned the explicit `runtime:synthetic-preview-acceptance` provider and the exact repaired release id. The deployed owner-auth bundle contained native `reportValidity()`, username/current-password autocomplete metadata, stable field identifiers, and no forced initial focus.

The synthetic fixture was isolated to the Preview branch, used only for deterministic acceptance, then `COMMAND_CENTER_PREVIEW_ACCEPTANCE` was reset to `0`. It was never promoted to production.

## Production-safe Vercel candidate

A no-fixture Preview already built from the exact same repaired SHA while the fixture flag was `0` was verified as the production-safe candidate:

- Vercel project: `command-center-preview`
- project id: `prj_gJISweXK7OGvFk1Iy48umKXjFhGX`
- team: Crestven Holdings / `team_kRfj5ZpITaFu83Qggpp3H6cg`
- Preview deployment: `dpl_4cNY1fgUH11DZiURwaJmEt6smvFK`
- deployment URL: `command-center-preview-jnhydn724-crestven-holdings.vercel.app`
- source SHA: `42c50f3093f3f435e53065a877356c317c7ba2f1`
- state: READY / Preview

Its `/release.json` exactly matched the production-safe identity above. A request to `/__preview__/runtime.json` returned only the ordinary SPA shell rather than synthetic JSON.

## Verification before production

Exact-head QA on the repaired source verified typecheck, 184/184 tests, the 676/676 repository audit, zero secret findings, zero policy violations, the protected icon, and the observed PWA install/offline/update/two-cache rollback lifecycle. A transient hosted-runner Chrome/D-Bus startup incompatibility was reproduced and corrected in the CI harness; the PWA lifecycle then passed. The final nonproduction phase-state step correctly remained stale until this new runtime was re-baselined and did not get bypassed.

## Production authorization result

The owner had already authorized continuation through the Command Center release and explicitly removed any false repeated authorization phrase gate. The repaired release proceeded through production without a new authorization phrase and without any paid-resource change.

P15.15 is `VERIFIED_COMPLETE` once the new evidence-only head passes exact-head CI.

## Existing production baseline and fallback

GitHub `main` remains protected and unchanged:

- main SHA: `855a06b43d152df1bc3c7574cc3f584bf1b51892`
- Pages URL: `https://jamesmorgan1234.github.io/James-morgan-project-command-center/`
- Pages workflow run: `39977771162`
- Pages artifact id: `12512325850`

Previous known-good Pages release retained as an additional fallback:

- SHA: `d40a7b2659400481c75f1de87d084b4d6cdce254`
- Pages workflow run: `39976823313`
- Pages artifact id: `12512175429`

The immediately prior Vercel production deployment remains a rollback target:

- deployment: `dpl_C4nsZ8yLpVicMf1MoT7Vx8fgWKg1`
- release SHA: `26d084f66829052081ef3f9f1792d84b7a6f545f`

## P15.1 blocker

P15.1 remains `BLOCKED_SOURCE_ARTIFACT` because the final reconciled individual `CCR-00001` through `CCR-05825` ledger is absent. This release decision does not erase or fabricate that ledger.
