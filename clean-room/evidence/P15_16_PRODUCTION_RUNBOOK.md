# P15.16 production deployment and live-verification runbook

State: PREPARED / PRODUCTION MUTATION STILL PROHIBITED BY CURRENT OWNER INSTRUCTION.

## Exact production candidate

Frozen runtime source:

`39fb4ab2df17f5ad087e21917b7e2f1b3ede481b`

Frozen production-safe artifact identity:

- releaseId: `39fb4ab2df17f5ad087e21917b7e2f1b3ede481b`
- buildHash: `25fcf841de982da4428cad74080ca7c91e2bb234894a7a942ba889c193aa2972`
- assetManifestHash: `a4636b5279685425a782a3c58160a94e6bd56bc52ca20efab691d389a8ee754f`
- schemaCompatibility: `cc-runtime-snapshot-v1`

Production-safe non-production deployment prepared for future promotion:

- Vercel deployment: `dpl_5QmUqr5uqU8kU8EZSVWwxaPnJjXS`
- Preview URL: `https://command-center-preview-4xlvt3tw9-crestven-holdings.vercel.app`
- target: Preview / not production
- state: READY
- exact source SHA: `39fb4ab2df17f5ad087e21917b7e2f1b3ede481b`
- synthetic Preview runtime endpoint: absent
- project-level environment variables: none

Stable Vercel production domain already verified on the project:

`https://command-center-preview-alpha.vercel.app`

Vercel project:

- project id: `prj_gJISweXK7OGvFk1Iy48umKXjFhGX`
- team id: `team_kRfj5ZpITaFu83Qggpp3H6cg`
- current team plan: Hobby
- current Vercel production deployment: none

The future cutover must promote the exact READY Preview deployment above rather than rebuild it. Vercel promotion does not rebuild the deployment.

## Current production and rollback/fallback

Current production remains untouched on GitHub Pages:

- URL: `https://jamesmorgan1234.github.io/James-morgan-project-command-center/`
- current production SHA: `855a06b43d152df1bc3c7574cc3f584bf1b51892`
- Pages workflow run: `39977771162`
- Pages artifact id: `12512325850`

Previous known-good Pages release:

- SHA: `d40a7b2659400481c75f1de87d084b4d6cdce254`
- Pages workflow run: `39976823313`
- Pages artifact id: `12512175429`

Because the Vercel production domain is separate and no DNS/custom-domain transfer is required, the existing GitHub Pages site remains live during initial Vercel verification. If the first Vercel production release fails acceptance, contain it and continue using the existing GitHub Pages production URL while the failed Vercel release is investigated. Do not delete release evidence.

## Why GitHub Pages is not the candidate host

Current GitHub Pages publishes the repository root through Jekyll. The clean-room runtime is rooted at `/` inside `clean-room/dist-web`, while the Pages project URL is hosted under `/James-morgan-project-command-center/`. Current clean-room manifest, routes, service-worker scope and root-relative assets are intentionally root-hosted. A straight merge would republish the existing root/VNext application, not the tested clean-room candidate.

The locked specification does not require GitHub Pages as the production host. Using the already-proven root-host Vercel project preserves the verified runtime instead of introducing a deployment-only base-path rewrite before release.

## Future production execution sequence

Only after the owner explicitly supersedes the current instruction prohibiting production deployment:

1. Reverify the owner instruction applies to this exact candidate and Vercel project.
2. Reverify `dpl_5QmUqr5uqU8kU8EZSVWwxaPnJjXS` is still READY, Preview-only, and resolves to source `39fb4ab2...`.
3. Re-fetch its `/release.json` and require exact match to the frozen release/build/asset/schema identity above.
4. Reverify current GitHub Pages production `855a06...` is still live and the fallback release identities are unchanged.
5. Confirm no production database migration or production-data mutation is required for this static/disconnected release. If a production data change becomes necessary, stop that change until separately authorized and prevalidated.
6. Promote only `dpl_5QmUqr5uqU8kU8EZSVWwxaPnJjXS` to production. Do not create a new build for the cutover.
7. Verify `command-center-preview-alpha.vercel.app` serves the exact frozen release identity.
8. Verify startup, all declared routes, safe disconnected state, auth/security fail-closed behavior, protected asset identity, service-worker controller, offline replay, waiting-worker behavior, and no synthetic acceptance data.
9. Verify GitHub Pages remains available as fallback during initial acceptance.
10. Any failed mandatory check requires containment and reopening the relevant phase before P15.17.

## Current stop condition

The release target, production-safe candidate, live production baseline, and fallback path are now resolved. P15.16 has no remaining discovery blocker.

The only current P15.16 blocker is the explicit owner instruction not to merge, deploy production, or modify production data. No production action was performed while creating this runbook.

P15.1 remains `BLOCKED_SOURCE_ARTIFACT`: the final reconciled individual `CCR-00001` through `CCR-05825` ledger is absent.
