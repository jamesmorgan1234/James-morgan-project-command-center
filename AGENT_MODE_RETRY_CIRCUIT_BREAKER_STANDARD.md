# Command Center Agent Mode retry circuit breaker standard

This standard supplements `AGENT_MODE_STANDARD.md`, `AGENT_MODE_OPTIMIZATION_STANDARD.md`, `AGENT_MODE_MICRO_WORK_POLICY.md`, and `AGENT_MODE_WORK_ENVELOPE_STANDARD.md`.

Its purpose is to prevent Agent Mode from wasting Work usage or time by repeating the same failing operation without new information, while preserving safe recovery from genuinely transient failures.

## Core rule

**Failure must produce information. If the next attempt has no new information, changed state, corrected input, justified route change, or meaningful recovery action, the retry is forbidden.**

Agent Mode must never loop on the same command merely because another attempt might work.

## Retry fingerprint

Every Work/external side-effect attempt receives a durable retry fingerprint derived from relevant state, including at minimum:

- agent session ID;
- project ID;
- agent step ID;
- provider/account/tool target;
- exact operation/action key;
- normalized inputs/payload hash;
- target resource ID/URL/path when applicable;
- selected Work model rung when Work is used;
- surrounding checkpoint/state;
- expected side effect/evidence;
- relevant capability/tool state;
- relevant authorization state.

Equivalent attempts with the same effective state are treated as the same attempt class.

## No identical blind retry

The same failed operation in the same state may not simply run again because `try again`, `maybe it will work`, `the previous run stopped`, or `the task is important`.

A failed operation with an identical effective fingerprint is retry-ineligible unless it is explicitly classified as transient and is using the single bounded automatic transient retry allowed below.

## Required failure classification

Every failed or blocked step must be classified before another attempt is allowed.

Supported categories include at least:

- `transient_network` — temporary network/request failure;
- `provider_timeout` — provider timed out or returned temporary service failure;
- `capability_insufficient` — selected model/tool genuinely lacked needed capability;
- `execution_complexity` — route/model may need a justified capability upgrade;
- `account_auth_required` — authentication/login/session action is required;
- `captcha_or_mfa` — user/security interaction is required;
- `permission_denied` — authorization/scope is insufficient;
- `provider_outage` — provider is unavailable;
- `missing_input` — required information/file/value is absent;
- `tool_unavailable` — required tool/connector is unavailable;
- `unexpected_state` — provider/page/resource state differs materially from the verified expectation;
- `protected_boundary` — action reached a spend/legal/security/destructive/publishing/account/other protected gate;
- `rate_limited` — provider/tool rate limit encountered;
- `session_expired` — prior authenticated session expired;
- `invalid_input` — submitted input is malformed/incorrect;
- `verification_failed` — executor claimed success but canonical evidence did not prove it;
- `duplicate_prevented` — equivalent side effect already exists;
- `unknown` — cause is not yet understood.

Unknown failures do not qualify for repeated automatic retries until more evidence is gathered.

## Automatic retry rule

At most **one automatic retry** is allowed for a genuinely transient failure such as:

- `transient_network`;
- `provider_timeout`;
- a clearly temporary provider hiccup.

The retry must use bounded backoff/cooldown and must first check whether canonical evidence shows the side effect already occurred despite the error.

No immediate request storm or repeated clicking is allowed.

## Later attempts require materially changed state

After a non-transient failure, or after the one transient automatic retry is exhausted, the next attempt requires at least one meaningful change, such as:

- corrected input;
- refreshed/reconnected session;
- changed navigation/tool/provider route;
- provider recovery;
- missing prerequisite supplied;
- newly granted valid permission;
- changed target/resource state;
- new evidence narrowing the failure cause;
- justified model reclassification;
- safe alternate execution path.

If none exists, the step remains blocked.

## Do not escalate when stronger reasoning cannot solve the problem

Never escalate model reasoning for:

- MFA;
- CAPTCHA;
- missing credentials;
- permission denial;
- provider outage;
- missing required user input;
- account ownership decision;
- legal/security decision;
- unsupported tool state;
- rate limit;
- `protected_boundary`;
- duplicate-prevented action.

## Model escalation only when capability is relevant

Potentially valid escalation causes are limited to evidence-backed `capability_insufficient` or `execution_complexity`.

Allowed progression:

`GPT-6 Luna High` → `GPT-6.1 Sol Light` → `GPT-6.1 Sol Medium`

Never above Sol Medium.

`GPT-6.1 Sol Medium` is approval-required before first Agent Mode use for the specific blocker. It is not an automatic generic retry rung.

If Sol Medium fails, stop and block the step unless a materially changed state later supports a new user-authorized attempt.

## Two-meaningful-attempt breaker

Two meaningful failed attempts on the same operation should normally block the step.

When blocked:

- checkpoint exact state;
- record failure evidence/classification;
- preserve completed work;
- continue independent normal-chat work if possible;
- do not hammer the same command;
- keep the blocked unit resumable from its first incomplete point.

## State change can reopen a blocked step

If provider/account/input/tool/permission state later changes materially, Agent Mode may reconcile the latest checkpoint and determine whether the blocked step is retry-eligible again.

A reopened step receives a new effective retry fingerprint reflecting the changed state.

## Provider cooldown and backoff

For transient provider/network failures:

- honor explicit provider `retry-after` information when available;
- use increasing bounded cooldowns for repeated transient conditions;
- stop automatic retries when the one-retry budget is exhausted;
- move provider outage/rate-limit conditions to waiting/blocked rather than consuming Work continuously.

## Duplicate-side-effect protection before every retry

Before retrying, check canonical evidence to determine whether the intended side effect already happened despite an error/timeout.

This is mandatory for actions such as:

- emails/messages;
- uploads;
- posts/publications;
- payments/purchases;
- account changes;
- migrations;
- deployments;
- generation batches;
- Integration writes;
- Work handoffs.

If evidence shows the action already occurred, the retry is forbidden and the existing result is reconciled.

## No-progress detector

Agent Mode detects logical loops even when individual operations technically return success.

A run is making no meaningful progress when repeated cycles produce no change in relevant state such as:

- verified completed step count;
- blocker resolution;
- canonical provider/database/repository state;
- evidence strength;
- dependency state;
- next valid action.

If the same plan/step sequence repeats without measurable improvement, stop the loop, checkpoint, classify the blocker, and choose a materially different valid route or block the step.

Normal-chat reasoning may continue diagnosing the blocker while side-effect retries remain gated.

## Portfolio-level Work circuit breaker

If repeated Work failures accumulate across projects or indicate a shared systemic problem such as provider outage, connector failure, expired common account session, broken browser environment, or systemic tool issue:

- pause creation of new Work handoffs for the affected capability/provider;
- continue all possible normal-chat work;
- queue affected Work-only blockers;
- diagnose the common problem;
- do not escalate model strength merely because multiple projects are affected;
- resume only after the underlying state changes or the user explicitly directs otherwise.

## Run exit criteria

Valid terminal states include:

- `completed` — authorized goal fully verified;
- `partially_completed` — verified progress made but remaining authorized work is blocked;
- `blocked` — no valid next action exists without new state/user input;
- `needs_user_action` — explicit user/account/legal/security action required;
- `paused` — intentionally paused at a safe checkpoint;
- `canceled` — user canceled the run;
- `failed` — bounded recovery exhausted without a safe continuation path.

A run stops when its authorized objective is complete. It must not invent follow-on work merely to remain active.

## Durable audit state

Record at minimum:

- retry fingerprint;
- attempt number;
- model/tool used;
- failure classification;
- whether state changed before retry;
- retry reason;
- backoff/cooldown applied;
- circuit-breaker activation;
- duplicate side effect prevented;
- final resolution;
- whether Work usage was avoided because a retry was blocked.

## Governing objective

**Agent Mode retries only when the next attempt is meaningfully different or a verified transient condition justifies one bounded retry. It never consumes scarce Work allowance by repeating the same failed command without new information.**
