# Command Center engineering templates and checklists

These templates describe evidence to record; a checkbox is not proof by itself. Mark an item complete only when its cited evidence exists for the exact source/version and scope. Preserve James Morgan's reserved authority, Command Center's top-level control-plane role, tenant/project isolation, deny-by-default access, provider replaceability, and the $0-first boundary. A repository checklist never claims a production, provider, legal, or physical-device result.

## Module contract template

- Module key (`mod:...`) and contract version:
- Accountable owner:
- Data owned:
- Capabilities owned:
- Data used:
- Capabilities used:
- Required module dependencies:
- Permissions requested and their scope:
- Routes and events owned:
- Migrations, compatibility and recovery plan:
- Health-check key and observable failure state:
- Data security class (`public`, `internal`, `sensitive`, `protected`, or `secret`):
- Activation policy (`startup`, `on-demand`, or `manual`):
- Failure behavior (`fail-closed`, `isolate`, or `degrade`) and why it is safe:
- May disable? May uninstall? Required safeguards:
- Named positive, negative and failure-path tests:
- Source/version and owner-approved architecture references:

Keep the contract consistent with `clean-room/src/kernel/module-contract.ts`. Do not duplicate another module's data or capability ownership. Declare cross-module reach-ins and dependency edges explicitly.

## Test template

- Requirement or defect and exact source/spec reference:
- Implementation/API under test:
- Isolated scope and deterministic fixture:
- Positive case: expected state/result and observable assertion:
- Negative case: invalid, unauthorized or wrong-scope input and expected denial:
- Failure case: unavailable, stale, partial or interrupted dependency and expected safe state:
- Idempotency/replay/concurrency case where applicable:
- Cleanup and leaked-handle check:
- Exact command and observed result:
- Limits: what this test does not prove (for example live provider, production, owner or device acceptance):

Tests must assert behavior, not only source text, object presence, filenames, or logging.

## Database migration template

- Migration filename and source commit:
- Canonical records/owners affected:
- Schema/API version and supported old/new readers:
- Forward change and data transformation:
- Transaction boundary and idempotency:
- Company/project ownership constraints:
- RLS, grants, functions, search_path and deny-by-default review:
- Secret/PII handling and audit/evidence references:
- Backfill size, batching and lock/resource assumptions:
- Compatibility window and rollback/roll-forward procedure:
- Recovery point, backup/integrity verification and restoration test:
- Focused isolated database test, including failure and privilege cases:
- Evidence and approver references:
- Explicit statement that committing a migration does not apply it to production:

Do not claim a reversible down migration where it would destroy user data or discard legitimate newer state. Prefer a reviewed forward repair or restore plan when rollback cannot preserve truth.

## Architecture decision record template

- Title, status, date, source commit:
- Decision owner and approving authority:
- Problem and canonical CCR/source references:
- Chosen decision:
- Alternatives considered and why rejected:
- Scope, exclusions and non-goals:
- Architecture owner/data owner and dependencies:
- Security, privacy, tenant-isolation and blast-radius effects:
- Migration/backward-compatibility plan:
- Cost/provider assumptions ($0-first):
- Consequences, risks and recovery:
- Evidence, review and supersession links:

A draft or accepted ADR must not imply James's approval unless the actual approval record is linked.

## Release checklist

- Exact candidate commit/tree and artifact digests:
- Source audit and dependency provenance attached:
- Current authority/roadmap and compatibility gates observed:
- Focused tests and exact-head module tests recorded with their actual counts:
- Build/artifact audit results linked to the same source:
- Protected asset IDs/hashes unchanged and authority reviewed:
- Security, RLS, secret-scanning and unresolved-risk results linked:
- Preview/staging and production claims kept separate:
- Required owner acceptance recorded from its actual source:
- Rollback/recovery path and evidence-preservation plan:
- Open blockers and phase gate status stated accurately:

An expected-open P15.1 gate remains open; a release checklist cannot override it.

## Incident checklist

- Incident ID, scope, observed time and reporting source:
- Owner/incident lead and authority to take each action:
- Affected companies, projects, providers, data classes and capabilities:
- Containment performed, with before/after evidence:
- What is unknown and how it is being checked:
- Secret/PII-safe diagnostics and evidence retention:
- Dependency, blast-radius and customer-impact review:
- Recovery/rollback decision and integrity verification:
- Required owner decision or external communication (do not send it without authorization):
- Follow-up remediation, tests and closure evidence:

## Recovery checklist

- Recovery target, exact version and isolated environment:
- Authorized owner and protected-action evidence:
- Backup provenance, encryption, digest and integrity result:
- Compatibility/migration checks and dependency order:
- Scope/isolation checks before restore:
- Restore/rollback plan, expected data loss and preservation of later valid state:
- Independent post-restore validation and evidence links:
- Failure/abort condition and safe recovery point:
- Actual exercise date/result; do not mark an unperformed drill complete:

## Security checklist

- Threat/scope and canonical control references:
- Authentication, authorization, RLS and revocation behavior:
- Cross-company/project isolation and wrong-owner denial:
- Secret/PII collection, storage, logging and export boundaries:
- Protected action and independent approval requirements:
- Provider permissions and read/write/action scopes:
- Negative/adversarial tests and observed results:
- Unresolved findings, accepted risk owner and expiry:
- Exact source commit, evidence references and review authority:

Never mark a control clear because a checklist exists.

## Visual acceptance checklist

- Approved visual reference and immutable asset identities/hashes:
- Exact build/source and browser viewport/device dimensions:
- Structural layout, hierarchy, spacing, contrast and typography:
- Keyboard, screen reader, touch target and reduced-motion checks:
- Browser-rendered screenshot/evidence reference and deviations:
- Protected geometry/artwork preservation:
- Distinguish automated/browser evidence from James's physical-device acceptance:
- Actual owner acceptance record, if required; otherwise leave it unresolved:

Do not replace a protected asset or invent owner acceptance.

## Agent end-to-end checklist

- Exact run/project/task IDs and authorized scope:
- Claim/lease/fencing and executor identity:
- Current policy, permission and owner authorization evidence:
- Input provenance, data classification and tenant boundary:
- Planned action and required preflight:
- Side effect allowed? Cite exact authority; otherwise prove it is denied:
- Evidence capture and durable checkpoint order:
- Independent verification of actual outcome:
- Duplicate/retry/restart and uncertain-provider-result behavior:
- Stop/pause/revocation and compensation path:
- Failure criteria, rollback/recovery and remaining blocker:
- Human acceptance boundary and exact decision record:

A mocked run proves boundary behavior only. It does not prove an external action, production outcome, or owner/device acceptance.
