# Command Center Agent Mode bounded Work policy

This policy supplements `AGENT_MODE_STANDARD.md`, `AGENT_MODE_OPTIMIZATION_STANDARD.md`, and `AGENT_MODE_WORK_ENVELOPE_STANDARD.md`.

The earlier micro-only automatic Work rule has been superseded by the newest explicit James Morgan policy. Automatic Work may extend beyond micro scope when the exact blocker fits the bounded low-risk Luna High or Sol Light envelope described below. Protected boundaries still override model cost and scope size.

## Mandatory Normal-Chat Exhaustion Gate

No Work handoff is eligible until Agent Mode proves the exact operation cannot currently be completed with normal-chat/Command Center capabilities.

Work convenience, task length, coding difficulty, repetition, or project importance are not valid reasons.

## Luna High automatic envelope

A bounded low-risk Luna High Work step or batch may run automatically without a separate approval prompt when all of the following are true:

1. Normal chat cannot perform the exact operation.
2. The step is inside the current explicit project/objective scope.
3. The operation is mechanical/simple enough for Luna High.
4. The scope class is `micro`, `small`, or `moderate`.
5. The account/provider and permitted action types are explicit.
6. No protected boundary is crossed.
7. The Work handoff ledger is written before execution.
8. Retry/circuit-breaker rules are active.
9. Returned evidence can be verified canonically.
10. Control returns to normal chat after the blocker is resolved.

A long click-heavy sequence may remain Luna High when it is still bounded, low-risk, and mechanically simple. Duration alone does not force escalation.

## Sol Light automatic envelope

Sol Light is allowed automatically for bounded low-risk `small` or `moderate` Work-only operations that require modest interpretation, branching, or troubleshooting beyond Luna High.

Automatic Sol Light requires:

- explicit bounded objective and project scope;
- explicit account/provider context;
- explicit permitted actions and stop conditions;
- no protected boundary;
- no active conflicting Agent Mode Work handoff;
- verification criteria and expected returned evidence;
- retry/circuit-breaker enforcement.

Do not select Sol Light merely because the surrounding project is large, important, or time-consuming.

## Sol Medium approval boundary

`GPT-6.1 Sol Medium` is the absolute Agent Mode Work ceiling and is approval-required before first use for the specific blocker.

Before requesting Sol Medium, Agent Mode must determine whether the blocker can be split so most execution remains in normal chat, Luna High, or Sol Light.

If Sol Medium fails, Agent Mode must stop and block the step unless a materially changed state later justifies a new user-authorized attempt.

Agent Mode must never select Astra or any stronger Work model.

## Protected boundaries always stop automatic Work

Automatic Luna/Sol Light permission does not authorize:

- spending, purchases, subscriptions, paid APIs, ads, credits, or paid trials;
- legal acceptance/attestations;
- MFA/CAPTCHA/identity verification;
- credential/security recovery or permission escalation;
- destructive/irreversible operations;
- unexpected account ownership decisions;
- locked asset replacement;
- unexpected scope expansion;
- publishing/production actions outside an already-authorized high-level unit;
- Books work outside explicit named Books authorization;
- any other action whose governing rule requires user approval.

Risk may shrink the automatic envelope. It may never enlarge it.

## Project switching rule

A Work-only step is not by itself a reason to switch projects.

Normal behavior is:

**normal chat progress → smallest bounded Work blocker → verify → resume the same project in normal chat.**

Switch projects only when the current project remains genuinely blocked by user action/approval, MFA/CAPTCHA, account login, provider outage, unavailable dependency, unresolved external response, Work outside the automatic envelope, or another real blocker.

## Concurrency

Default active Agent Mode Work handoffs remains **1**.

Other projects may continue normal-chat work and queue their Work-only blockers. Do not start unrelated Work sessions concurrently merely because their model rung is low.

## Retry circuit breaker

No failed Work operation may be blindly repeated. Follow `AGENT_MODE_RETRY_CIRCUIT_BREAKER_STANDARD.md`.

At most one automatic retry is allowed for a genuinely transient failure. Later attempts require materially changed state. Two meaningful failed attempts normally block the step.

## Usage honesty

Automatic bounded Work does not change usage uncertainty. Until a trustworthy account-wide Work usage source exists, total allowance, remaining allowance, and predicted percentage cost remain `N/A`.

Agent Mode records only its own verified handoffs and never presents that ledger as the OpenAI account usage meter.

## Governing objective

**Do everything possible in normal chat first. When Work is genuinely irreducible, use the least-sufficient allowed model and the broadest safe bounded envelope, verify the returned result, and immediately resume in normal chat.**
