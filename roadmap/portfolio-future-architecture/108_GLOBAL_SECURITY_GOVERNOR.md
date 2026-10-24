# 108 — Global Security Governor

**Status:** DESIGN NOW / BUILD NOW FOUNDATION

## Purpose
Set a non-bypassable portfolio security baseline while allowing stricter company/domain packs. Security Governor does not own every local control; it owns the minimum contract, posture visibility, cross-company containment and escalation path.

## Baseline domains
Identity/authentication • session/device assurance • machine/Agent identity • authorization/delegation • secrets/keys • data sensitivity/privacy • encryption • network/provider isolation • untrusted-input security • prompt injection • malware/file safety • DLP/egress • dependency/supply-chain • sandboxing • vulnerability posture • abuse/misuse • audit/provenance • incident response • backup/recovery • kill/safe mode.

## Security classification
Every company/resource declares security class, sensitivity, impact/blast radius, public/internal/confidential/secret class, regulated flags, region/residency, owner and incident severity rubric.

## Non-bypassable invariants
- deny-by-default protected actions;
- no secret plaintext in Brain memory/client/logs;
- external content is untrusted data, not authority;
- company/tenant isolation is default;
- delegated scopes can only narrow;
- fresh verification where risk requires it;
- immutable audit/evidence for protected effects;
- provider/tool/action versions are known;
- high-risk work has independent verification;
- safe mode/kill controls always available;
- security policy can become stricter locally but not weaker than global baseline.

## Runtime security gate
Every material Agent/tool side effect can be checked through: actor/machine identity → company/project/tenant → action/resource → authority/delegation → content/input trust → sensitivity/region → risk/blast radius → policy → budget/rate → approval/fresh verification → execution → verification/evidence.

## Prompt-injection/untrusted-input layer
Trust/provenance labels survive email/web/search/RAG/files/OCR/tool outputs/context construction. Scanner/sanitizer/quarantine seam appears before untrusted content can influence tool selection or authority. Tool outputs remain data until explicitly parsed under a trusted schema.

## Secrets
Secret registry stores references/metadata only: owner/company/provider/account/type/scopes/created/expiry/rotation/revocation/dependencies/health. Rotation and emergency revoke are protected. Browser/Brain/normal logs never receive raw long-lived secrets.

## Supply chain
Dependencies, actions, containers, packages and build tools carry source/version/hash/license/provenance. Lifecycle scripts and untrusted builds execute in sandbox. CI blocks unpinned or disallowed critical dependencies according to policy.

## Security posture / drift
Per company: open incidents, risky credentials, stale dependencies, policy drift, failed scans/evals, unresolved vulnerabilities, backup-recovery evidence, domain/cert state and security debt. Portfolio view uses metadata only and preserves isolation.

## Incident containment
Incident can contain task → Agent → Brain → provider/integration → project → company → portfolio execution layer. Containment must not require deleting evidence. One company incident cannot automatically expose or stop unrelated companies unless global/root infrastructure is affected.

## DESIGN NOW
Global baseline schema, security classification, runtime gate interface, secret metadata/dependency model, untrusted-input labels, supply-chain manifest, incident containment hierarchy and company security posture contract.

## BUILD NOW
Connect existing Category 2 Security, Category 7 Agency preflight, Brain/provider registry, dependency pinning and incident lifecycle under this portfolio-wide Security Governor contract. Add two-company cross-boundary and prompt-injection propagation tests.

## BUILD BEFORE FIRST COMPANY
Customer/tenant security controls, production company security packs, security posture center, external scanner/provider integrations and production incident runbooks.

## Acceptance
No future company can register a Brain/Agent/tool/provider without declared security class/policy/evidence seams; a malicious input in Company A cannot acquire authority or cross into Company B; a compromised company credential can be contained without exposing other credential stores.