# Command Center Deployment Standard

Deployment is the controlled path from verified work to verified release. For Command Center itself, production remains GitHub Pages from `main`; this standard does not introduce a paid hosting provider. For other project types, Deployment consumes their verified roadmap/checkpoint acceptance gates rather than inventing a separate definition of “ready.”

## Seven deployment phases

1. **Release Manifest** — record the intended release surface, protected assets, release identity, required checks, and production target.
2. **Pre-Deploy Validation** — all required automated QA and project-specific acceptance gates must pass before a release can proceed.
3. **Deployment Pipeline** — production changes flow through one controlled path appropriate to the project; Command Center itself uses feature branch → PR → exact-head QA → merge to `main` → GitHub Pages.
4. **Post-Deploy Health Check** — verify the exact deployed version and its critical live behaviors.
5. **Version History** — persist verified production releases, validation evidence, and health evidence in owner-scoped durable records.
6. **Rollback** — rollback is reviewable and non-self-merging. A manual GitHub Action may prepare a branch that restores a known-good historical tree and opens a PR; it may never push directly to `main` or merge its own PR.
7. **PWA Update Control** — every Command Center runtime release that changes assets advances the app-config/cache identity while preserving the approved PWA identity, viewport lock, startup repair marker, launcher artwork, Android vertical scrolling, Back behavior, and update safety.

## Release rules

- `main` is the only Command Center production branch.
- GitHub Pages is the Command Center production host.
- A deployment is not complete because code was merged or files merely exist. It is complete only after the exact release is deployed/published successfully and post-release verification passes.
- Required PR QA must be green on one exact head. Earlier green runs do not authorize a later head.
- Production merge and deployment are part of an explicitly authorized high-level completion command such as `Complete Deployment`; otherwise the normal protected-boundary rules apply.
- No paid hosting, paid CI, paid monitoring, or paid deployment add-on is introduced without exact authorization.
- No fake release, validation, health, or rollback rows are seeded. Durable version history records only verified real events.
- Release percentages are consequences of verified phases; they are never manually set to make the capability look complete.
- A project-specific release cannot bypass its roadmap/checkpoint quality gates simply because a production/publishing path is available.

## Project-specific acceptance gates

Deployment consumes the newest verified roadmap/checkpoint state for the project and requires all release-critical dependencies and acceptance gates to be satisfied. A file existing, an image being generated, or a manuscript reaching its nominal end does not make the project release-ready by itself.

For Books, the release/publishing boundary must preserve the locked Books standards already defined in `BOOK_PROJECT_ROADMAP_STANDARD.md` and `BOOK_QA_GATES_STANDARD.md`.

### Written books

Before release-ready status may be used, the applicable verified gates include:

- manuscript/content completion;
- developmental quality;
- humanization/natural authorial voice;
- line edit/proofread;
- continuity and chronology;
- originality / no recycled generic filler;
- title + subtitle + approved cover + series identity + interior promise alignment;
- interior formatting and production-file QC;
- metadata/pricing readiness where applicable;
- required platform-preview/publishing checks.

If the prose still reads mechanical, repetitive, templated, padded, emotionally implausible, or visibly machine-generated, **humanization has not passed** and Deployment must not treat that title as release-ready.

### Coloring books

Deployment additionally requires the verified coloring-book gates, including theme/cover alignment, uniqueness, printable line quality, page count, margins, duplicate/composition checks, and practical real-world colorability. Visually impressive but miserable-to-color pages fail release readiness.

### Cookbooks

Deployment additionally requires recipe accuracy, title/method promise alignment, ingredient/time/temperature/yield plausibility, finished-dish image match, typography/layout readability, page-fill quality, and whole-book design uniformity.

### Workbooks and other book types

Deployment requires the applicable use-goal, exercise/content, usability, humanization, accuracy, visual-system, production-file, metadata, and platform gates defined by that title’s roadmap.

### Locked and approved assets

Deployment must preserve explicitly approved covers, art, canon, rollout orders, exceptions, and already-verified work. It must not regenerate or “improve” locked assets merely because a release is being prepared.

## Release manifest

`deployment-release-manifest.json` is the repository-level contract for the current Command Center release family. It records:

- manifest schema/version;
- production branch and hosting provider;
- expected app-config and PWA cache versions;
- required QA suites;
- protected viewport/startup/PWA identity requirements;
- approved icon and book-cover atlas hashes;
- rollback policy.

The manifest intentionally does not hard-code the final production commit SHA because the merge commit does not exist until merge. The exact deployed commit belongs in durable release history after production verification.

## Pre-deploy validation

The release gate is fail-closed:

- every required suite must complete successfully;
- all applicable project-specific acceptance gates must already be verified in the newest canonical roadmap/checkpoint;
- the suite set includes Deployment QA plus existing protected regressions;
- the exact PR head must be captured before merge;
- any head movement invalidates the previous gate and requires fresh QA;
- an unresolved or stale required gate blocks release instead of being converted into a guess.

For Command Center application releases, the branch/PR regression suite is the concrete gate. For books and other projects, the project’s verified roadmap/checkpoint gates are the concrete gate before publishing/upload actions are allowed.

## Deployment pipeline

The canonical Command Center production sequence is:

1. branch from the latest verified `main`;
2. implement and checkpoint;
3. open PR;
4. run every required QA suite on the exact head;
5. merge only that exact head;
6. GitHub Pages builds and deploys from `main`;
7. verify the deployed SHA and critical live assets;
8. record the verified release and health evidence.

Other project types use their own verified publishing/deployment path, but the same principles apply: exact authorized scope, pre-release gates, controlled execution, post-release verification, durable history, and recoverable continuation state.

## Post-deploy health

For Command Center itself, at minimum verify:

- `main` equals the expected merge SHA;
- Pages build and deploy both succeeded for that SHA;
- `index.html` loads the expected app-config version;
- service worker uses the expected cache version;
- protected viewport lock and startup-repair marker remain unchanged;
- approved launcher/icon and cover assets remain protected;
- the application still loads its prior completed capabilities.

For books and other projects, post-release verification must use the applicable live/published artifact and platform state rather than assuming upload equals success.

A failed health check means the release is not verified even if the deployment/publishing provider reported a nominal success.

## Durable version history

Supabase stores owner-scoped Command Center release records in:

- `deployment_releases`;
- `deployment_validations`;
- `deployment_health_checks`;
- `deployment_rollbacks`.

Browser access is read-only. Verified production history is written only through trusted execution after external evidence has been checked. Project-specific publishing history may remain in each project’s canonical checkpoint/lineage stream and can be normalized into Deployment history later without fabricating records.

## Rollback

Rollback must preserve auditability and user control.

The manual Command Center rollback workflow:

- accepts an exact historical target commit;
- requires that target to be an ancestor of current `main`;
- creates a new rollback branch from current `main`;
- restores the repository tree from the target commit into one new commit;
- pushes only the rollback branch;
- opens a PR to `main`;
- never pushes directly to `main`;
- never merges the PR automatically.

Normal exact-head QA and production verification still apply to the rollback PR.

For books or other published artifacts, rollback/replacement must respect the provider’s actual rules and must never silently overwrite a locked approved artifact or published edition.

## PWA update control

For every Command Center runtime release:

- advance app-config query version;
- advance service-worker cache version;
- include new runtime assets in install/fresh-asset handling;
- preserve `cc-startup-repair-attempted-v63` unless a separately tested startup-repair migration explicitly requires a new marker;
- preserve `minimum-scale=1,maximum-scale=1,user-scalable=no`;
- preserve approved icon hashes and manifest identity;
- keep navigation requests network-first with cached fallback;
- keep runtime assets recoverable through the existing self-healing cache repair path.
