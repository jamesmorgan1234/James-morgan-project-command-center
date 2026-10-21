# Command Center Agent Mode micro-Work policy

This policy refines `AGENT_MODE_STANDARD.md` and `AGENT_MODE_OPTIMIZATION_STANDARD.md` with the newest user instruction. Where those older drafts say all Work consumption asks first, this newer policy controls.

## Automatic micro-Work is allowed

A genuine Work-only `micro` step may run automatically without a separate approval prompt when **all** of the following are true:

1. The Normal-Chat Exhaustion Gate proves the exact operation cannot be completed by available normal-chat/Command Center capabilities.
2. The step is the smallest independently useful blocked operation and does not broaden project scope.
3. The operation is low-risk and does not cross another protected boundary such as spending, legal acceptance, identity/MFA/CAPTCHA, destructive change, security permission escalation, public publishing, production deployment, or locked-asset replacement unless that separate boundary is already explicitly authorized under its governing rule.
4. The Work model is the least-sufficient model for the exact blocked operation. Mechanical/simple browser microsteps default toward `GPT-6 Luna High` when sufficient.
5. No stronger model is chosen merely because the surrounding project is large, difficult, important, or long-running.
6. The handoff is recorded in the Work handoff ledger before execution.
7. The returned result is verified against canonical evidence.
8. Control returns immediately to normal chat after the microstep is verified.

## Project switching rule

A Work-only microstep is **not** by itself a reason to switch projects. The normal behavior is:

**normal chat progress → bounded automatic Work microstep → verify → resume the same project in normal chat.**

Agent Mode switches to another eligible project only when the current project remains blocked because:

- the blocker is not eligible for automatic micro-Work;
- user approval/action is required;
- the provider/account/tool is unavailable;
- a protected boundary requires explicit authorization;
- a Work handoff is already outstanding and cannot yet be reconciled;
- or another dependency cannot currently be satisfied.

## What still requires approval

Automatic micro-Work permission does **not** grant unlimited Work privileges.

A separate explicit approval is still required for:

- `small`, `moderate`, or `substantial` Work unless another newer explicit policy authorizes it;
- open-ended Work;
- cross-project Work execution;
- multiple simultaneous Work sessions beyond the default concurrency guard;
- escalation to stronger Work models when the exact blocker does not clearly justify the change;
- any protected action that independently requires user authorization.

If classification is uncertain between `micro` and a larger class, Agent Mode must not silently choose `micro`; it should ask or keep the step blocked until the scope is clarified by evidence.

## Usage honesty

Automatic micro-Work does not change the usage uncertainty rule. Until a trustworthy account-wide Work usage source exists, remaining Work allowance and exact percentage cost remain `N/A`. Agent Mode records its own handoff/model/duration evidence without pretending that ledger equals the OpenAI account usage meter.

## Governing objective

The intended loop is:

**do everything possible in normal chat at High reasoning → use the smallest automatic low-cost Work microstep only when genuinely necessary → verify it → return immediately to normal chat → continue the same project.**
