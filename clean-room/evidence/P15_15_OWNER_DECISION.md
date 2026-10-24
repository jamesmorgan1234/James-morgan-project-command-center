# P15.15 owner decision

## Owner direction

The owner has repeatedly authorized Command Center production deployment/modification and explicitly corrected the prior false authorization boundary. The newest controlling instruction is to continue through deployment and testing without requiring another authorization phrase.

This supersedes the earlier temporary no-production-mutation constraint for the authorized Command Center release path. It does not authorize paid services, unrelated projects, or unrelated destructive changes.

During P15.17 physical owner acceptance, James reported a real Samsung sign-in defect. The first repair restored native browser validation/autofill behavior, but James then confirmed that opening the fresh production link still reached the login surface and still could not complete sign-in. That kept P15.17 open and required another runtime repair rather than an install/reinstall workaround.

The current repair routes only Supabase Auth calls through a same-origin Vercel rewrite while keeping private REST/data traffic direct to Supabase. This removes the Samsung/Chrome cross-origin Auth transport dependency without putting private data queries behind the PWA same-origin cache. Dedicated regression tests prove the Vercel-origin Auth route and the direct REST route separately.

## Frozen repaired runtime candidate

Exact repaired clean-room runtime source:

`9b6d136447def58ad8a4df3f05261f7bd6b7ef80`

Production-safe artifact identity:

- releaseId: `9b6d136447def58ad8a4df3f05261f7bd6b7ef80`
- buildHash: `72918429817b12957178f4685f84b6a67ac895d5972517e1dc5b4969cdf301f3`
- assetManifestHash: `b9a76bb84da35231ac7dfc72d430b8372becaf27158dfa3a1fd1e352f00eb2a7`
- schemaCompatibility: `cc-runtime-snapshot-v1`

The repaired source includes the owner-sign-in form corrections, the same-origin Auth proxy, the direct private REST boundary, and the CI-only PWA Chrome startup stabilization. All changes after this frozen candidate must be acceptance/release evidence only unless a new owner-reported defect reopens runtime work.

## Production-safe Vercel Preview

A no-fixture Preview was built from the exact frozen SHA:

- Vercel project: `command-center-preview`
- project id: `prj_gJISweXK7OGvFk1Iy48umKXjFhGX`
- team: Crestven Holdings / `team_kRfj5ZpITaFu83Qggpp3H6cg`
- Preview deployment: `dpl_9GTPfksYY5En25ne6XdxFbRTQDHW`
- deployment URL: `command-center-preview-k53dhma4y-crestven-holdings.vercel.app`
- source SHA: `9b6d136447def58ad8a4df3f05261f7bd6b7ef80`
- state: READY / Preview

The branch fixture flag remained `0`; no synthetic Preview runtime was present in this candidate.

## Verification before production

Exact-head QA on the frozen source verified typecheck, 186/186 tests, the 677/677 repository audit, zero secret findings, zero policy violations, protected-icon verification, artifact validation, and the observed PWA install/offline/update/two-cache rollback lifecycle. The added Auth routing regressions verify that a Vercel browser origin sends password Auth to `/__cc_auth__/token?grant_type=password`, while private REST remains direct to the canonical Supabase project.

The final phase-state step intentionally remained stale until this new runtime was re-baselined; that guard was not bypassed.

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

The immediately prior Vercel production deployment remains the first Vercel rollback target:

- deployment: `dpl_BN93YBWTbTDttpXTDWDCwKBVVXp5`
- release SHA: `42c50f3093f3f435e53065a877356c317c7ba2f1`

The older repaired Vercel deployment `dpl_C4nsZ8yLpVicMf1MoT7Vx8fgWKg1` remains available as an additional containment point.

## P15.1 blocker

P15.1 remains `BLOCKED_SOURCE_ARTIFACT` because the final reconciled individual `CCR-00001` through `CCR-05825` ledger is absent. This release decision does not erase or fabricate that ledger.
