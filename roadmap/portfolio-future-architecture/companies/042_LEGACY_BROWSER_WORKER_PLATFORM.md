# Company 042 — Legacy Browser Worker Platform

**Company ID:** `company:future:042`  
**Primary project:** `project:company:future:042`  
**Roadmap version:** `COMPANY-042-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no external browser automation or credential use.

## Business identity

Purpose: provide reliable, auditable automation for authorized web portals and legacy software that lack usable APIs.

Problem: critical workflows still require humans to navigate portals, upload/download files, copy data and recover from UI changes; ordinary browser scripts are brittle and unsafe around credentials/side effects.

Value: versioned browser workflows with visual/DOM state verification, scoped credentials, replay, checkpointing, selector recovery and human escalation.

## Product tree

Browser Worker Runtime; Workflow Recorder; Visual+DOM Action Model; Selector Recovery; Portal Adapter Registry; Credential/Session Broker; File Upload/Download Worker; Form Completion; Data Extraction; Screenshot/Evidence Capture; State Verification; Checkpoint/Resume; Workflow Replay/Simulation; Change/Drift Detection; Human-in-the-Loop Step; CAPTCHA/User-Presence Boundary; Multi-Browser/Viewport; Private Runner; Queue/Scheduler; Audit/Incident Console; API/SDK/OEM; Vertical Portal Packs.

## Feature/customer/vertical tree

Features: target allowlists, account/project scope, session isolation, page-state hash, DOM/visual anchor, action preconditions, post-action verification, timeout/retry, idempotency, downloads hash, upload provenance, MFA/user step, browser profiles, cookies/secrets vault refs, rate limits, concurrency, screenshot redaction, network log metadata, selector confidence, rollback where feasible.

Customers: operations teams, enterprises, agencies/integrators, SaaS vendors needing legacy connectors, finance/admin teams, healthcare administrative portals, logistics, procurement, public portals, compliance/credentialing systems.

Verticals: supplier/customer portals, government/admin sites, insurance/admin portals, banking read-only/admin workflows where lawful, logistics, property, healthcare admin, ERP legacy web, credentialing, ecommerce marketplaces. High-risk financial/legal actions require strict approval.

## Brain / architecture

Brain understands page state, workflow intent and likely selector recovery; it plans navigation and diagnoses UI drift. Deterministic browser policy owns allowed domains/actions, credential scope and protected-action preconditions. Page content is untrusted and cannot override system instructions.

Architecture: sandboxed browser containers, Playwright-like driver abstraction, visual/DOM model, session broker, secrets refs, workflow/state engine, artifact store, screenshot/redaction, network policy, replay fixtures, LLM/vision only for recovery/semantic element identification under hard action constraints.

## Agent tree

Workflow Recorder Agent, Navigation Agent, Selector Recovery Agent, Form Agent, File Transfer Agent, Extraction Agent, Visual State Agent, Session/MFA Coordinator, Drift Monitor, QA/Replay Agent, Security/Prompt-Injection Agent, Incident/Recovery Agent, Adapter Builder.

## Deterministic services

Browser pool; session isolation; credential proxy; domain/URL policy; action schema; selector engine; file scanner; download/upload hash; screenshot artifact service; workflow/checkpoint engine; queue; rate/concurrency limiter; network egress control; audit; protected click/submit gate.

## Workflow

Authorize target/account/workflow → establish isolated session → validate page/origin → execute bounded step → verify post-state/artifact → checkpoint → continue → on drift, attempt safe selector recovery/simulation → escalate if ambiguous/protected → capture completion evidence → destroy/expire session.

## Integrations / API / data

Browsers, secret managers, workflow engines, file/object storage, email/MFA handoff, task queues, ticketing, source systems receiving extracted/uploaded data. APIs for worker session/workflow/step/artifact/status/replay/health.

Data moat: portal adapter library, selector-recovery history, page-state fingerprints and verified workflow traces; credentials/customer payloads remain isolated.

## Monetization / distribution

Browser minutes/sessions/workflows, portal adapters, enterprise/private runners, API, managed adapter maintenance, OEM. Distribution via automation/integration/RPA ecosystems, SaaS vendors, consultants.

## Security/privacy/legal

Highest-risk area: untrusted pages, credential theft, prompt injection, malicious downloads, accidental destructive clicks. Domain/action allowlists, sandboxing, download scanning, origin validation, credential broker, no secret exposure to model, screenshot redaction, human/MFA boundaries, protected-action gate, terms/access restrictions.

## Failure / edge cases

UI redesign, popups, localization, A/B, CAPTCHA, MFA, session expiry, network lag, duplicate submit, file chooser, browser crash, anti-bot, malicious page instruction, unexpected redirect, download mismatch. Use checkpoints, idempotency, state verification, strict origin checks and manual fallback.

## Scale / overlap

Few adapters → enterprise browser-worker fleet → legacy integration infrastructure. Overlap #8 workflows, #31 forms, #64 inbox, #100 modernization. #042 specializes in no-API browser execution.

## Classification

**DESIGN NOW:** browser-worker sandbox, hostile-content boundary, session/credential refs, action verification, artifact provenance, worker quotas.  
**BUILD NOW:** Command Center/Agency browser-worker contracts and prompt-injection defenses likely need direct strengthening after reverse-map.  
**BUILD BEFORE FIRST COMPANY:** isolated browser pool, credential broker, egress policy and artifact scanner.  
**COMPANY-SPECIFIC LATER:** customer portal adapters/product/pricing.  
**SCALE-ONLY:** large distributed browser fleet.

# Mandatory 24-part completion block

1. Product Tree: runtime/recorder/DOM-visual/selector/adapters/session/files/forms/extraction/screenshots/verification/checkpoints/replay/drift/HITL/MFA/browsers/private/queue/audit/API/packs.
2. Feature Tree: allowlists/scope/session/page hashes/pre-post checks/idempotency/files/MFA/profiles/secrets/rates/redaction/network/selector confidence.
3. Customer Tree: ops/enterprise/integrators/SaaS/finance admin/health admin/logistics/procurement/public/compliance.
4. Vertical Tree: supplier/government/insurance/logistics/property/health admin/ERP/credential/ecommerce portals.
5. Brain Tree: navigation/recovery diagnosis under deterministic domain/action boundaries; page instructions untrusted.
6. Agent Tree: recorder/navigation/selector/forms/files/extract/visual/session/drift/QA/security/recovery/adapters.
7. Service Tree: browser pool/session/credentials/domain policy/actions/selectors/file scan/artifacts/checkpoints/queue/rate/network/audit/gates.
8. Workflow Tree: authorize→session→validate→step→verify→checkpoint→recover/escalate→evidence→destroy session.
9. Integration Tree: browsers/secrets/workflows/storage/MFA/tasks/tickets/downstream systems.
10. Data Tree: workflows/adapters/page fingerprints/steps/checkpoints/artifacts/evidence/incidents.
11. API Tree: sessions/workflows/steps/artifacts/status/replay/health.
12. Monetization Tree: minutes/sessions/workflows/adapters/private/API/managed/OEM.
13. Distribution Tree: RPA/automation/integration/SaaS/consulting ecosystems.
14. Automation Tree: navigation/files/forms/extraction/recovery; protected/user-presence steps gated.
15. Moat Tree: adapter library, recovery corpus, verified traces, security/reliability.
16. Platform Tree: browser workers→legacy integration network→no-API execution infrastructure.
17. Risk Tree: credentials, prompt injection, malicious files, destructive clicks, unauthorized access, duplicate submit.
18. Scale Tree: adapters→enterprise fleet→distributed regional workers.
19. Spinoff Tree: adjacent #8/#31/#64/#100 already cover workflow/forms/inbox/modernization.
20. Command Center Dependencies: Agency workers, untrusted-input security, secrets, artifacts, resource governor, policy gates.
21. Design-Now Requirements: isolated browser/action/state-verification interface.
22. Build-Now Requirements: likely browser worker and prompt-injection hardening after reverse-map.
23. Safe-to-Defer Requirements: commercial portal adapters/customer product/pricing.
24. Autonomous Mature State: stable portal workflows run unattended with evidence; UI drift/user-presence/protected actions escalate; James supervises strategy only.

## Saturation result

Further branches are portal packs or general workflow/modernization integrations already represented.
