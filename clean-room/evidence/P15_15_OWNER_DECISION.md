# P15.15 owner decision

## Owner direction

The owner has repeatedly authorized Command Center production deployment/modification and explicitly corrected the prior false authorization boundary. The newest controlling instruction is to continue through deployment and testing without requiring another authorization phrase.

This supersedes the earlier temporary no-production-mutation constraint for the authorized Command Center release path. It does not authorize paid services, unrelated projects, or unrelated destructive changes.

## Frozen runtime candidate

Exact promotable clean-room runtime source:

`39fb4ab2df17f5ad087e21917b7e2f1b3ede481b`

Production-safe build identity from exact-source CI:

- releaseId: `39fb4ab2df17f5ad087e21917b7e2f1b3ede481b`
- buildHash: `25fcf841de982da4428cad74080ca7c91e2bb234894a7a942ba889c193aa2972`
- assetManifestHash: `a4636b5279685425a782a3c58160a94e6bd56bc52ca20efab691d389a8ee754f`
- schemaCompatibility: `cc-runtime-snapshot-v1`

All commits after `39fb4ab2` through the Category 15 evidence head are acceptance/evidence infrastructure only; no application runtime source changed.

## Production-safe Vercel candidate

A fresh non-production Preview was built from exactly `39fb4ab2` with no stored project environment variables and without `COMMAND_CENTER_PREVIEW_ACCEPTANCE=1`:

- Vercel project: `command-center-preview`
- project id: `prj_gJISweXK7OGvFk1Iy48umKXjFhGX`
- team: Crestven Holdings / `team_kRfj5ZpITaFu83Qggpp3H6cg`
- Preview deployment: `dpl_5QmUqr5uqU8kU8EZSVWwxaPnJjXS`
- deployment URL: `command-center-preview-4xlvt3tw9-crestven-holdings.vercel.app`
- source SHA: `39fb4ab2df17f5ad087e21917b7e2f1b3ede481b`
- state before cutover: READY / Preview

The deployed `/release.json` exactly matched the CI build identity above. Its `index.html` contained no synthetic P15.14 runtime endpoint.

## Production authorization result

P15.15 is `VERIFIED_COMPLETE`.

The owner directed continuation through P15.16 and production deployment. The release proceeded without another authorization phrase.

## Existing production baseline and fallback

The prior GitHub Pages production remains available as an independent fallback:

- live URL: `https://jamesmorgan1234.github.io/James-morgan-project-command-center/`
- Pages release / main SHA: `855a06b43d152df1bc3c7574cc3f584bf1b51892`
- Pages workflow run: `39977771162`
- Pages artifact id: `12512325850`

Previous successful Pages release retained as an additional known-good fallback:

- SHA: `d40a7b2659400481c75f1de87d084b4d6cdce254`
- Pages workflow run: `39976823313`
- Pages artifact id: `12512175429`

The Vercel production cutover is additive; GitHub `main` was not changed by the Vercel deployment.

## P15.1 blocker

P15.1 remains `BLOCKED_SOURCE_ARTIFACT` because the final reconciled individual `CCR-00001` through `CCR-05825` ledger is absent. This release decision does not erase or fabricate that ledger.
