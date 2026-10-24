# P15.15 owner decision

## Owner direction

The owner directed Command Center to continue and explicitly stated that P15.15 is not a stopping boundary.

The still-controlling instruction not to merge, deploy production, or modify production data remains in force. P15.15 therefore authorizes release preparation and candidate freezing, not a production mutation.

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
- target: Preview (`null`), not production
- state: READY

The deployed `/release.json` exactly matches the CI build identity above. Its `index.html` contains no `command-center-runtime-endpoint` meta tag, so the synthetic P15.14 runtime fixture is not active in this candidate.

The project already owns the verified production domain:

`command-center-preview-alpha.vercel.app`

The Crestven Holdings team is currently on Vercel Hobby. No new domain purchase or plan upgrade is required for this release path; normal Hobby usage limits remain applicable.

## Existing production baseline and fallback

Current production remains GitHub Pages and was not changed:

- live URL: `https://jamesmorgan1234.github.io/James-morgan-project-command-center/`
- current Pages release / main SHA: `855a06b43d152df1bc3c7574cc3f584bf1b51892`
- Pages workflow run: `39977771162`
- Pages artifact id: `12512325850`

Previous successful Pages release retained as an additional known-good fallback:

- SHA: `d40a7b2659400481c75f1de87d084b4d6cdce254`
- Pages workflow run: `39976823313`
- Pages artifact id: `12512175429`

The Vercel cutover is additive: no DNS/custom-domain move is required and the existing GitHub Pages production remains live unless the owner separately changes it. This provides a cross-platform fallback during initial Vercel production verification.

## P15.1 blocker

P15.1 remains `BLOCKED_SOURCE_ARTIFACT` because the final reconciled individual `CCR-00001` through `CCR-05825` ledger is absent. This release decision does not erase or fabricate that ledger.
