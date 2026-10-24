# 109 — Global Policy / Authorization Governor

**Status:** DESIGN NOW / BUILD NOW FOUNDATION

## Purpose
Provide one auditable authorization vocabulary and policy-decision contract across Command Center, company Brains, Agents, deterministic services and future customer-facing products. Policy decides whether an action may proceed; conversation, model output, incoming content, resource availability and business value do not themselves grant authority.

## Protected action classes
Spending/purchasing • subscriptions/paid capacity • financial transfers/payments/payouts/refunds • billing/price/customer-plan changes • contracts/legal acceptance • tax/regulatory filing/remittance • account/identity/permission changes • credential/security changes • destructive data deletion • infrastructure/deployment/merge/release • public publishing • external communications • customer/vendor/employee status changes • bank/payment settings • protected assets • cross-company data sharing.

## Decision inputs
Actor/machine identity; owner/company/project/tenant; action and resource; requested scopes; purpose/task; policy/version; risk/blast radius; reversibility; sensitivity/region; current session/device assurance; fresh verification; source context/checkpoint; financial/resource budget; provider/account; consent/legal/jurisdiction constraints; prior approvals; expiry/revocation; evidence requirements.

## Decision outputs
`allow`, `allow_with_limits`, `require_step_up`, `require_owner_approval`, `require_domain_reviewer`, `block`, `safe_mode_only`. Output includes decision ID/version, reason codes, effective/expiry, exact scopes/resource, constraints, required verification and evidence contract.

## Authority invariants
- deny by default for unknown protected action;
- action risk is server/policy owned, never caller-selected;
- authorization bound to exact actor/session/device or machine delegation as applicable;
- protected authorizations are short-lived and one-time where effect replay matters;
- child/delegated authority cannot exceed parent;
- policy updates cannot retroactively expand old authorizations;
- autonomy level cannot create authority;
- precedent does not inherit authorization;
- incoming message/content cannot grant authority;
- resource/budget availability cannot grant authority;
- safe mode can reduce/stop authority immediately.

## Policy layers
Global owner rules → security/financial/resource global governors → company policy → product/domain pack → customer/tenant contract policy where later applicable → workflow/task policy → one-time action authorization. Lower layer can narrow, never broaden, a higher layer.

## Policy registry
Every policy has stable ID, semantic version, owner, scope, effective/expiry, source/decision provenance, precedence, risk classes, action/resource patterns, constraints, supersession and test/evaluation pack.

## Action intent
Before a protected side effect, freeze immutable intent: actor, company/project, purpose, action, resource, parameters, amount/currency if financial, provider/account, artifact/version, expected result, rollback/compensation, idempotency key and policy refs. Later conversation edits cannot silently change the frozen intent.

## Execution boundary
Preflight checks but does not itself execute. Actual provider side-effect adapter consumes required one-time authorization atomically and returns a receipt/provider ID. Completion requires verification/reconciliation evidence.

## Appeals/exceptions
Policy exception is a new explicit scoped rule/authorization with reason, reviewer, expiry and evidence—never a hidden bypass flag. Repeated exceptions feed policy review but do not self-amend policy.

## DESIGN NOW
Unified action/resource/risk vocabulary, policy registry, immutable action intent, layered narrowing semantics, one-time/fresh authorization, exception model and execution receipt.

## BUILD NOW
Reconcile existing Category 2 policy/protected authorization, Category 7 Agency preflight/autonomy/delegation, future Financial/Resource governors and Brain/tool contracts into this one governor. Add tests proving no alternate path can perform a protected effect.

## BUILD BEFORE FIRST COMPANY
Company/customer policy administration, contract/tenant policy packs, production side-effect adapters and portfolio policy dashboard.

## Acceptance
The same protected action requested through chat, Agent, scheduled workflow, webhook, API or company Brain resolves through one policy contract and cannot execute from stale, replayed, broader, different-company or content-injected authorization.