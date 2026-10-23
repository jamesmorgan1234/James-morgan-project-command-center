# Category 1 — Core Kernel + Governance

Status target: **IMPLEMENTED AND CATEGORY-QA VERIFIED** before Category 2 begins.

## Scope

Category 1 implements the minimum authoritative runtime contracts for A00 Owner Authority/Governance, A01 Core Kernel/Lifecycle, and A02 Registries/Capability Fabric without importing the legacy application runtime.

## Implemented contracts

- one production runtime singleton through `getApplicationRuntime()`;
- deterministic application lifecycle state machine;
- core-versus-optional module bootstrap behavior;
- recovery-required state on core startup failure;
- optional-module failure containment;
- Module Registry with dependency declaration and cycle detection;
- Capability Registry with one canonical owner per capability;
- Route Registry and one Router history owner;
- typed Event Bus with subscriber isolation;
- typed Command Bus with invariant gates, request IDs, idempotent result reuse, and verified-command event;
- Authority Registry with newest-explicit-owner precedence while preserving desired-state versus actual-state conflict;
- Requirement Registry with stable IDs, source lineage, canonical states, and verified-only progress calculation;
- Invariant Registry with before/after command checks.

## Explicit non-goals for this category

- no production root cutover;
- no Supabase mutation;
- no identity provider implementation yet;
- no visual shell implementation yet;
- no Brain or Agent execution implementation yet;
- no provider credentials;
- no legacy runtime import or DOM injection.

## Category 1 exit gates

- syntax check passes for every new runtime module;
- all Node built-in tests pass;
- duplicate capability owner is rejected;
- circular module dependency is rejected;
- invalid lifecycle transition is rejected;
- core bootstrap failure enters `recovery_required`;
- optional module failure produces `degraded` without killing the kernel;
- command idempotency prevents duplicate side effect handler invocation;
- owner authority precedence and desired-vs-actual separation are tested;
- router Back/history ownership is tested;
- production root remains untouched.
