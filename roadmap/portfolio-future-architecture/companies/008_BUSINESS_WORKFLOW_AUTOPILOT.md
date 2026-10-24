# Company 008 — Business Workflow Autopilot

**Company ID:** `company:future:008`  
**Primary project:** `project:company:future:008`  
**Roadmap version:** `COMPANY-008-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only.

## Business identity

Purpose: let businesses define, generate, execute and continuously improve multi-system workflows using deterministic orchestration plus bounded AI for understanding, planning and exception handling.

Problem: operations are spread across SaaS apps, email, documents, browser-only portals and databases. Traditional automation is brittle; pure AI agents are too unconstrained.

Value: reliable workflow automation with typed state, explicit approvals, browser/API/document actions, recovery, self-healing and explainable evidence.

Delivery: SaaS workflow builder, natural-language studio, API/SDK, embedded/OEM engine, private/self-hosted runner, managed automation service, vertical workflow packs.

## Product tree

- Visual Workflow Builder.
- Natural-Language Workflow Compiler.
- Trigger/Event Hub.
- API Connector Library.
- Browser Worker / Legacy Portal Connector.
- Document & Attachment Processor.
- Email/Inbox Workflow Adapter.
- Database/Spreadsheet/CRM/ERP Actions.
- Approval & Human Task Center.
- Exception/Recovery Engine.
- Self-Healing Selector/Connector Layer.
- Workflow Template Marketplace.
- Vertical Packs (finance ops, HR, support, sales ops, procurement, property/construction, ecommerce, compliance).
- Workflow Analytics & Optimization.
- Test/Simulation Sandbox.
- Version/Release Manager.
- Embedded Workflow SDK.
- Private Runner / Edge Connector.
- Managed Workflow Operations.

## Feature/customer/vertical trees

Features: triggers, schedules, webhooks, conditions, branches, loops with bounds, state machines, parallel steps, dependencies, retries/timeouts, idempotency, compensation, checkpoints, approval, secrets refs, RBAC, input/output schemas, file handling, browser verification, API health, rate limits, budgets, environment separation, testing, simulation, rollback, audit, metrics, alerts, templates, imports/exports, accessibility/localization.

Customers: freelancers/prosumers, SMB, agencies, operations teams, IT/automation, enterprise, SaaS vendors embedding workflows, integrators/MSPs.

Verticals: sales/revops, support, finance/AP/AR, HR/IT, procurement/vendor ops, ecommerce, logistics, property/service businesses, compliance, legal/admin, marketing ops, data ops. High-stakes workflows use stronger approvals and deterministic checks.

## Brain capability tree / architecture

Brain understands business intent, maps natural language to workflow specs, identifies dependencies/edge cases, proposes connector/tool choices, detects exceptions and recommends repairs. Deterministic workflow runtime owns execution/state/retry/idempotency. Brain cannot self-authorize protected actions or silently change workflow scope.

Architecture: workflow DAG/state machine, event bus/queue, connector registry, secret refs, browser worker, document service, relational state, object artifacts, audit ledger, policy engine, scheduler, rules/constraints, optional LLM for intent/field mapping/exception explanation, model router for cost/privacy.

## Agent tree

Workflow Architect, Connector Agent, Browser Automation Agent, Document Agent, Data Mapping Agent, Exception Analyst, Recovery Agent, QA/Simulation Agent, Security/Policy Agent, Cost/Performance Optimizer, Template Curator, Integration Health Agent, Support Diagnostics Agent.

## Deterministic services

Workflow compiler/runtime; trigger service; scheduler; queue; state/checkpoint store; idempotency; connector runtime; browser session manager; file/object store; schema validator; credential proxy; approval service; retry/backoff; compensation; DLQ; rate limiter; cost meter; audit; test harness; feature flags/versioning.

## Inputs / outputs / workflows

Inputs: user intent, workflow specs, events, API/browser/document/email data, approvals, policies, credentials refs.

Outputs: actions, transformed data, documents, updates, notifications, tasks, evidence, exceptions, reports.

Lifecycle: describe/import → compile typed graph → validate scopes/credentials/policies → simulate/test → approve/version → activate → trigger → execute/checkpoint/verify → compensate/retry/escalate → close evidence → optimize from verified history.

## Integrations / API

CRM, email/calendar, spreadsheets, DB/warehouse, accounting, ERP, ecommerce, support, project/task tools, files/cloud storage, chat, forms/e-sign, HRIS, payment metadata, webhooks, generic REST/GraphQL, browsers, custom connectors. Developer SDK for connector schemas/actions/triggers, custom functions, events and embedded workflows.

## Data / moat

Versioned workflow specs, connector schemas, mappings, execution/evidence history, exception patterns, repair recipes, template library, integration health. Moat: reliable cross-system connector graph, recovery corpus, vertical templates, low-code/NL compiler guarded by deterministic runtime.

## Monetization / distribution

Runs/steps, active workflows, connectors, seats, browser minutes, document pages, private runners, premium vertical packs, managed ops, OEM/embedded, enterprise SLA. Distribution through integrations/app marketplaces, developers/integrators, vertical partners, templates/content, product-led free workflow tier.

## Security/privacy/compliance

Untrusted inbound data; prompt-injection isolation; secret references only; connector least privilege; per-workflow scopes; approval/protected action gates; sandbox custom code/browser; rate/cost limits; customer/company isolation; data retention/export/delete; regional/private runner; audit.

## Failure / edge cases

Duplicate trigger, API partial success, browser UI drift, stale data, webhook replay, long-running task, rate limit, credential expiry, downstream outage, malformed document, malicious email, approval timeout, compensation failure, branch race. Use idempotency, durable state, exactly-once side-effect patterns where possible, verification, retries/backoff, DLQ, compensation, checkpoints, human escalation.

## Scale / platform / spinoffs

Micro: dozens workflows. ~$100K ARR: vertical templates/private connectors. ~$1M: enterprise orgs/private runners. ~$10M: large connector ecosystem/marketplace. ~$100M+: workflow operating platform with distributed execution.

Adjacent #9 document-to-workflow, #42 browser workers, #64 inbox, #69 billing, #71 webhooks. Keep Company 008 as general orchestration layer.

## Classification

**DESIGN NOW:** typed workflow/event/command contracts, idempotency, compensation, connector registry, credential refs, approvals, company/project scope.  
**BUILD NOW:** Command Center already has workflow/Agency primitives; reverse-map generic extension seams.  
**BUILD BEFORE FIRST COMPANY:** tenant/company workflow namespaces, billing/meter, connector sandbox/private runner interface.  
**COMPANY-SPECIFIC LATER:** external workflow UI/connector library/templates/pricing.  
**SCALE-ONLY:** distributed global runner fleet/marketplace.

# Mandatory 24-part completion block

1. **Complete Product Tree:** visual/NL builder, triggers, connectors, browser/docs/email/data, approvals, recovery, self-healing, marketplace, analytics, sandbox, release, SDK/private/managed/vertical packs.
2. **Complete Feature Tree:** DAG/state/parallel/conditions/retries/idempotency/compensation/checkpoints/security/testing/audit/metrics/accessibility.
3. **Complete Customer Tree:** individuals/SMB/agencies/ops/IT/enterprise/SaaS/integrators.
4. **Complete Vertical Tree:** revops/support/finance/HR/IT/procurement/ecommerce/logistics/services/compliance/admin/data.
5. **Complete Brain Capability Tree:** intent→spec, planning, mapping, exception/recovery recommendations; execution deterministic and policy-gated.
6. **Complete Agent Tree:** architect/connectors/browser/docs/mapping/exception/recovery/QA/security/cost/templates/health/support.
7. **Complete Service Tree:** compiler/runtime/events/scheduler/queue/checkpoint/idempotency/connectors/browser/files/schema/credentials/approval/retry/DLQ/rate/meter/audit/test/version.
8. **Complete Workflow Tree:** author→compile→validate→simulate→approve→activate→execute→verify→recover→evidence→improve.
9. **Complete Integration Tree:** CRM/email/calendar/data/accounting/ERP/commerce/support/tasks/files/chat/forms/HRIS/webhooks/APIs/browser.
10. **Complete Data Tree:** specs/connectors/mappings/runs/checkpoints/evidence/exceptions/repairs/templates/health.
11. **Complete API/Developer Tree:** connector SDK, workflow API, events, custom functions, embedded engine/private runners.
12. **Complete Monetization Tree:** runs/steps/workflows/connectors/seats/browser/docs/private/packs/managed/OEM/SLA.
13. **Complete Distribution Tree:** app marketplaces/integrators/vertical partners/templates/dev ecosystem/PLG.
14. **Complete Automation Tree:** generation, execution, retries, exception classification, repair suggestions, health/cost tuning.
15. **Complete Moat Tree:** connector graph, reliable runtime, recovery corpus, vertical templates, guarded NL compiler.
16. **Complete Platform Tree:** automation builder → workflow platform → vertical packs/marketplace → distributed operating layer.
17. **Complete Risk Tree:** duplicate effects, connector compromise, browser drift, prompt injection, secrets, cost/rate, partial execution.
18. **Complete Scale Tree:** single team → enterprise → distributed/private runners → global platform.
19. **Complete Spinoff Tree:** existing #9/#42/#64/#71 cover specialist modules.
20. **Command Center Dependencies:** workflow/event kernel, Agency, policy/security, connector/capability registries, resource/cost governors, isolation.
21. **Design-Now Requirements:** durable typed workflows, idempotency/compensation, scoped connectors/credentials.
22. **Build-Now Requirements:** shared Command Center workflow extension seams after reverse-map.
23. **Safe-to-Defer Requirements:** external customer product, marketplace, vertical packs, pricing/private runner fleet.
24. **Autonomous Mature State:** workflows run/checkpoint/recover continuously; Brain improves specs and exceptions; James sees only approvals, novel failures and strategy.

## Saturation result

Remaining branches are connector/vertical packs or specialist companies already named. No additional top-level company is required.
