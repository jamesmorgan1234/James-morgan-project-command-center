# Command Center Deployment Standard

Deployment is the controlled path from verified code to verified production. It does not replace the existing GitHub Pages architecture and it does not introduce a paid hosting provider.

## Seven deployment phases

1. **Release Manifest** — record the intended release surface, protected assets, release identity, required checks, and production target.
2. **Pre-Deploy Validation** — all required automated QA must pass on one exact PR head before merge.
3. **Deployment Pipeline** — production changes flow through feature branch → PR → exact-head QA → merge to `main` → GitHub Pages.
4. **Post-Deploy Health Check** — verify the exact `main` merge SHA, Pages deployment result, release identity, and critical protected behaviors.
5. **Version History** — persist verified production releases, validation evidence, and health evidence in owner-scoped durable records.
6. **Rollback** — rollback is reviewable and non-self-merging. A manual GitHub Action may prepare a branch that restores a known-good historical tree and opens a PR; it may never push directly to `main` or merge its own PR.
7. **PWA Update Control** — every release that changes runtime assets advances the app-config/cache identity while preserving the approved PWA identity, viewport lock, startup repair marker, launcher artwork, Android vertical scrolling, Back behavior, and update safety.

## Release rules

- `main` is the only production branch.
- GitHub Pages is the production host.
- A deployment is not complete because code was merged. It is complete only after the exact merged SHA is deployed successfully and post-deploy health is verified.
- Required PR QA must be green on one exact head. Earlier green runs do not authorize a later head.
- Production merge and deployment are part of an explicitly authorized high-level completion command such as `Complete Deployment`; otherwise the normal protected-boundary rules apply.
- No paid hosting, paid CI, paid monitoring, or paid deployment add-on is introduced without exact authorization.
- No fake release, validation, health, or rollback rows are seeded. Durable version history records only verified real events.
- Release percentages are consequences of verified phases; they are never manually set to make the capability look complete.

## Release manifest

`deployment-release-manifest.json` is the repository-level contract for the current release family. It records:

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
- the suite set includes Deployment QA plus existing protected regressions;
- the exact PR head must be captured before merge;
- any head movement invalidates the previous gate and requires fresh QA.

## Deployment pipeline

The canonical production sequence is:

1. branch from the latest verified `main`;
2. implement and checkpoint;
3. open PR;
4. run every required QA suite on the exact head;
5. merge only that exact head;
6. GitHub Pages builds and deploys from `main`;
7. verify the deployed SHA and critical live assets;
8. record the verified release and health evidence.

## Post-deploy health

At minimum verify:

- `main` equals the expected merge SHA;
- Pages build and deploy both succeeded for that SHA;
- `index.html` loads the expected app-config version;
- service worker uses the expected cache version;
- protected viewport lock and startup-repair marker remain unchanged;
- approved launcher/icon and cover assets remain protected;
- the application still loads its prior completed capabilities.

A failed health check means the release is not verified even if Pages reported success.

## Durable version history

Supabase stores owner-scoped records in:

- `deployment_releases`;
- `deployment_validations`;
- `deployment_health_checks`;
- `deployment_rollbacks`.

Browser access is read-only. Verified production history is written only through trusted execution after external evidence has been checked.

## Rollback

Rollback must preserve auditability and user control.

The manual rollback workflow:

- accepts an exact historical target commit;
- requires that target to be an ancestor of current `main`;
- creates a new rollback branch from current `main`;
- restores the repository tree from the target commit into one new commit;
- pushes only the rollback branch;
- opens a PR to `main`;
- never pushes directly to `main`;
- never merges the PR automatically.

Normal exact-head QA and production verification still apply to the rollback PR.

## PWA update control

For every runtime release:

- advance app-config query version;
- advance service-worker cache version;
- include new runtime assets in install/fresh-asset handling;
- preserve `cc-startup-repair-attempted-v63` unless a separately tested startup-repair migration explicitly requires a new marker;
- preserve `minimum-scale=1,maximum-scale=1,user-scalable=no`;
- preserve approved icon hashes and manifest identity;
- keep navigation requests network-first with cached fallback;
- keep runtime assets recoverable through the existing self-healing cache repair path.
