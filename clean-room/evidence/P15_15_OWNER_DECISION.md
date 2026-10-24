# P15.15 owner decision

## Owner direction

The owner has repeatedly authorized Command Center production deployment/modification and explicitly corrected the prior false authorization boundary. The newest controlling instruction is to continue through deployment and testing without requiring another authorization phrase.

This supersedes the earlier temporary no-production-mutation constraint for the authorized Command Center release path. It does not authorize paid services, unrelated projects, or unrelated destructive changes.

## Frozen runtime candidate

Exact promotable clean-room runtime source:

`26d084f66829052081ef3f9f1792d84b7a6f545f`

Production-safe build identity from exact-source CI and the no-fixture Preview:

- releaseId: `26d084f66829052081ef3f9f1792d84b7a6f545f`
- buildHash: `8983949b56415320f5a2bef039ed7198d7f8bab2bb565eb58359121f253d2c07`
- assetManifestHash: `281006562b117dfdcd47cb4886ed5b5496c95e8683fc9d88e8c7094080ba4a01`
- schemaCompatibility: `cc-runtime-snapshot-v1`

All commits after `26d084f6` through the Category 15 evidence head are acceptance/evidence infrastructure only; no application runtime source changed.

## P15.14 synthetic acceptance Preview

The repaired runtime was first exercised on a branch-scoped synthetic acceptance Preview:

- deployment: `dpl_3ywqiM4cnKPMoQM6VzXqhQPH2af6`
- URL: `command-center-preview-6ytcspjwd-crestven-holdings.vercel.app`
- source SHA: `26d084f66829052081ef3f9f1792d84b7a6f545f`
- state: READY / Preview

The synthetic fixture was explicitly isolated to Preview and was used only for deterministic rendering/route acceptance. It was disabled before production-safe candidate construction and was never promoted to production.

## Production-safe Vercel candidate

After synthetic acceptance completed, `COMMAND_CENTER_PREVIEW_ACCEPTANCE` was set to `0` for the clean-room Preview branch and a fresh no-fixture Preview was built from exactly `26d084f6`:

- Vercel project: `command-center-preview`
- project id: `prj_gJISweXK7OGvFk1Iy48umKXjFhGX`
- team: Crestven Holdings / `team_kRfj5ZpITaFu83Qggpp3H6cg`
- Preview deployment: `dpl_BhX4mp4T8Z5kyyPN3otkemWymetk`
- deployment URL: `command-center-preview-ciq81vc3m-crestven-holdings.vercel.app`
- source SHA: `26d084f66829052081ef3f9f1792d84b7a6f545f`
- state before cutover: READY / Preview

The deployed `/release.json` exactly matched the production-safe CI identity above. Its `index.html` contained no synthetic P15.14 runtime endpoint, and `/__preview__/runtime.json` resolved only to the ordinary SPA shell rather than fixture JSON.

## Production authorization result

P15.15 is `VERIFIED_COMPLETE` once the evidence-only head passes exact-head CI.

The owner directed continuation through P15.16 and production deployment. The repaired release proceeded without another authorization phrase and without any paid-resource change.

## Existing production baseline and fallback

GitHub `main` remained unchanged during the Vercel cutover:

- main SHA: `855a06b43d152df1bc3c7574cc3f584bf1b51892`
- Pages URL: `https://jamesmorgan1234.github.io/James-morgan-project-command-center/`
- Pages workflow run: `39977771162`
- Pages artifact id: `12512325850`

Previous known-good Pages release retained as an additional fallback:

- SHA: `d40a7b2659400481c75f1de87d084b4d6cdce254`
- Pages workflow run: `39976823313`
- Pages artifact id: `12512175429`

The prior Vercel production deployment also remains a rollback target:

- deployment: `dpl_DWvrvK3sCFboMdf8bdHVqNAHQAdq`
- release SHA: `39fb4ab2df17f5ad087e21917b7e2f1b3ede481b`

## P15.1 blocker

P15.1 remains `BLOCKED_SOURCE_ARTIFACT` because the final reconciled individual `CCR-00001` through `CCR-05825` ledger is absent. This release decision does not erase or fabricate that ledger.
