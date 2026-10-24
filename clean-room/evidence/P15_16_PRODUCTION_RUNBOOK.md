# P15.16 production deployment and live-verification runbook

State: VERIFIED COMPLETE.

## Exact production candidate

Frozen runtime source:

`39fb4ab2df17f5ad087e21917b7e2f1b3ede481b`

Frozen production-safe artifact identity:

- releaseId: `39fb4ab2df17f5ad087e21917b7e2f1b3ede481b`
- buildHash: `25fcf841de982da4428cad74080ca7c91e2bb234894a7a942ba889c193aa2972`
- assetManifestHash: `a4636b5279685425a782a3c58160a94e6bd56bc52ca20efab691d389a8ee754f`
- schemaCompatibility: `cc-runtime-snapshot-v1`

## Production execution

The original Vercel promote call returned HTTP 422 and did not change production. The release then used Vercel's production-target redeploy path from the exact frozen Preview deployment, preserving the same pinned Git SHA and project settings.

Production deployment:

- provider: Vercel
- project: `command-center-preview`
- project id: `prj_gJISweXK7OGvFk1Iy48umKXjFhGX`
- team: Crestven Holdings / `team_kRfj5ZpITaFu83Qggpp3H6cg`
- deployment id: `dpl_DWvrvK3sCFboMdf8bdHVqNAHQAdq`
- deployment URL: `https://command-center-preview-aswi4snqb-crestven-holdings.vercel.app`
- stable production domain: `https://command-center-preview-alpha.vercel.app`
- source SHA: `39fb4ab2df17f5ad087e21917b7e2f1b3ede481b`
- target: production
- state: READY

Production aliases include:

- `command-center-preview-alpha.vercel.app`
- `command-center-preview-crestven-holdings.vercel.app`
- `command-center-preview-git-build-spec-88e6a5-crestven-holdings.vercel.app`

## Live verification

Live `/release.json` on the production domain matches the frozen identity exactly:

- releaseId: `39fb4ab2df17f5ad087e21917b7e2f1b3ede481b`
- buildHash: `25fcf841de982da4428cad74080ca7c91e2bb234894a7a942ba889c193aa2972`
- assetManifestHash: `a4636b5279685425a782a3c58160a94e6bd56bc52ca20efab691d389a8ee754f`
- schemaCompatibility: `cc-runtime-snapshot-v1`

The live HTML shell carries the same release id. The live manifest is valid at root scope and references the exact approved Command Center icon. The live service worker carries the same release id and the verified install/cache/offline/update/two-cache rollback logic.

All 19 declared route paths were checked against the live production deployment and returned the same Command Center SPA shell for the exact release:

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

An unknown route also returned the SPA shell; the exact deployed runtime's already-passed route-state tests and P15.14 integrated acceptance enforce that unknown routes resolve to the explicit unavailable state rather than silently falling back to Home.

Vercel reported zero production runtime errors in the post-deploy verification window.

The production release is static/disconnected and required no production database migration or production-data mutation.

## Rollback / containment

The prior GitHub Pages production remains available during owner acceptance:

- URL: `https://jamesmorgan1234.github.io/James-morgan-project-command-center/`
- current Pages SHA: `855a06b43d152df1bc3c7574cc3f584bf1b51892`
- Pages workflow run: `39977771162`
- Pages artifact id: `12512325850`

Previous known-good Pages release:

- SHA: `d40a7b2659400481c75f1de87d084b4d6cdce254`
- Pages workflow run: `39976823313`
- Pages artifact id: `12512175429`

GitHub `main` was reverified after the Vercel deployment and remains exactly `855a06b43d152df1bc3c7574cc3f584bf1b51892`.

## Phase result

P15.16 = `VERIFIED_COMPLETE` once this evidence package passes exact-head CI.

P15.17 owner acceptance is the next phase.

P15.1 remains `BLOCKED_SOURCE_ARTIFACT`: the final reconciled individual `CCR-00001` through `CCR-05825` ledger is absent.
