# Command Center Agent Mode Work execution envelope standard

This standard supplements `AGENT_MODE_STANDARD.md` and `AGENT_MODE_OPTIMIZATION_STANDARD.md`.

Its purpose is to let Agent Mode use low-cost Work models for bounded click-heavy or mechanical execution without forcing unnecessary user approvals, while preventing strong-model or high-risk Work from consuming shared Work allowance without the user's knowledge.

## Core principle

The Work decision is based on the **exact blocked operation**, not the surrounding project size.

For each Work-only boundary, Agent Mode evaluates together:

1. action risk;
2. execution complexity;
3. reasoning/model rung required;
4. account/session/provider context;
5. whether normal chat has exhausted every relevant capability;
6. whether the operation is independently bounded and verifiable;
7. whether another Agent Mode Work handoff is already active.

The resulting permission is called the **Work execution envelope** or **autonomy envelope**.

A broader envelope means Agent Mode may keep the bounded Work task running through more low-risk steps before returning to normal chat. It does **not** mean unlimited Work access or a guaranteed percentage of account allowance.

## Usage truth

OpenAI Work/Codex allowance is not a fixed number of tasks or hours. Usage depends on model, reasoning setting, task, inputs/outputs, and multi-step execution.

Therefore Command Center must not claim:

- one hour on a model equals a fixed percentage of allowance;
- a task will consume a known percentage unless a trustworthy product usage signal provides that figure;
- duration alone predicts usage;
- switching model restores a shared allowance.

Until an account-wide Work usage source is available to Command Center, remaining allowance remains `N/A`.

The execution envelope is a **policy boundary**, not a billing estimate.

## Hard Work reasoning ceiling

The current user-visible Work choices include higher Astra options, but **Agent Mode is not permitted to use any Work reasoning/model setting above `GPT-6.1 Sol Medium`.**

The allowed Agent Mode Work ladder is therefore:

1. `GPT-6 Luna High`
2. `GPT-6.1 Sol Light`
3. `GPT-6.1 Sol Medium`

`GPT-6 Astra Light`, `GPT-6 Astra Medium`, and any future Work option stronger/more expensive than the user-approved ceiling are **prohibited for autonomous Agent Mode execution** unless the user explicitly changes this ceiling later.

If Sol Medium is insufficient, Agent Mode must stop, preserve the verified checkpoint, explain the exact unresolved capability/reasoning blocker, and return control to the user. It must not silently escalate beyond the ceiling.

This ceiling overrides older Agent Mode documentation that listed Astra as an available escalation rung.

## Envelope rule by model rung

### GPT-6 Luna High — broadest automatic envelope

Luna High is preferred for Work-only operations that are primarily:

- clicking/navigation;
- uploading already-prepared files;
- entering verified values;
- simple forms;
- repetitive provider/account UI steps;
- copying prepared text;
- mechanical checking;
- routine low-risk browser execution;
- long but simple bounded action sequences.

When risk is low and scope is bounded, Agent Mode may automatically run **micro, small, and moderate** Luna High Work-only batches without requiring a fresh approval for every individual click.

The envelope may cover a long sequence or extended duration when:

- the objective is explicit and bounded;
- the allowed account/provider is explicit;
- the permitted action types are explicit;
- no spending, legal acceptance, account ownership/security decision, destructive operation, publication/deployment boundary, or other protected action is crossed;
- no unexpected scope expansion occurs;
- checkpoints/evidence can be captured during execution;
- the task remains appropriate for Luna High.

Duration by itself does not force escalation. A two-hour sequence of simple clicks may remain Luna High if the task still fits this profile.

### GPT-6.1 Sol Light — medium automatic envelope

Use for Work-only execution that needs modest interpretation, branching, or troubleshooting.

Agent Mode may automatically run bounded small/moderate low-risk batches when the objective and permitted actions are explicit. The envelope is narrower than Luna High because more reasoning/allowance may be consumed.

Escalation to Sol Light must be justified by the blocked operation, not by project importance or duration.

### GPT-6.1 Sol Medium — highest allowed Agent Mode Work rung

Use for nontrivial interpretation/debugging or moderately complex Work-only execution when Luna High and Sol Light are not reasonably sufficient.

This is the **absolute Agent Mode Work reasoning ceiling** under the current policy.

Automatic execution should generally be limited to a clearly bounded operation or short/moderate batch whose risk remains low and whose scope is explicit. Larger/open-ended use at Sol Medium requires explicit user approval.

If Sol Medium cannot complete the blocked operation, Agent Mode must stop and report the blocker rather than selecting Astra or any stronger Work setting.

## Risk overrides model allowance

A low-cost model does not make a protected action safe to automate.

Even on Luna High, Agent Mode must stop for protected boundaries such as:

- purchases/spending/credits/subscriptions/ads/trials;
- legal acceptance/attestations;
- MFA/CAPTCHA/identity verification/security recovery;
- password/credential changes;
- destructive or irreversible operations;
- security/permission escalation;
- public messages, publishing, production deployment, or reputation-impacting actions when not already explicitly authorized and fully gated;
- replacement of locked/approved assets;
- book scope not explicitly targeted by the user;
- any unexpected account/project/scope change.

Risk class can only make an execution envelope smaller, never larger.

## Scope-class and model-class are separate

Do not treat `micro`, `small`, `moderate`, or `substantial` as direct proxies for model cost.

Examples:

- a **moderate** batch of 150 repetitive UI clicks may still be Luna High and may fit the broad automatic envelope;
- a **micro** five-minute debugging decision may require Sol Medium and therefore use the highest allowed rung;
- a long task may remain low-rung when it is mechanically simple;
- a short task may need the ceiling when reasoning complexity is high.

Agent Mode classifies both:

- `scope_class`: micro / small / moderate / substantial
- `model_rung`: Luna High / Sol Light / Sol Medium

Approval is determined from the combination of model rung, risk, scope, and protected boundaries.

## Automatic continuation on the same project

When a permitted Luna High or otherwise permitted Work batch resolves the current blocker:

1. capture returned evidence;
2. verify the actual downstream result;
3. mark the narrow Work step verified;
4. close/update the Work handoff ledger entry;
5. return immediately to normal chat;
6. continue the **same project** from the next incomplete unit.

Do not switch projects merely because Work was used.

Switch projects only when the current project remains blocked after the permitted handoff or is waiting on user action/external dependency.

## Long-running low-rung Work

A longer automatic Work session is allowed only when it is a **bounded low-risk objective**, not an open-ended instruction such as “keep working on everything.”

For longer Luna/Sol Light runs, Agent Mode should checkpoint periodically by meaningful unit rather than arbitrary clock time. Checkpoints should record:

- completed actions;
- evidence;
- current page/account/provider state where available;
- errors/retries;
- whether the task remains within the approved envelope;
- exact next action.

If the task unexpectedly begins requiring stronger reasoning, broader scope, higher risk, or a protected boundary, stop the automatic envelope and reclassify before continuing.

## Concurrency

Default active Agent Mode Work handoffs remains **1**.

A broad Luna High envelope does not authorize multiple simultaneous projects to consume Work.

Other projects may continue in normal chat or queue their Work-only blockers. Compatible low-risk micro/small blockers in the same account/session may be bundled when safe and explicitly within scope.

## Escalation logic

Escalate model rung only for reasons where model capability matters.

Do not escalate for:

- MFA/CAPTCHA;
- missing credentials;
- unavailable account/session;
- permission denial;
- provider outage;
- missing input;
- user-only legal/security decisions;
- unsupported tool state.

For a genuine capability failure, move only to the **next sufficient allowed rung**, re-evaluate the execution envelope, and never exceed Sol Medium. If Sol Medium is insufficient, stop and report the blocker.

## Efficiency objective

The optimization objective is:

**Use normal chat for everything possible. When Work is irreducible, use the least-sufficient allowed model and the broadest safe bounded execution envelope that minimizes handoff overhead without risking uncontrolled usage.**

This means Agent Mode should not ask for approval every few clicks on a safe Luna High task, but it also must not interpret low-rung Work as unlimited permission to operate across unrelated projects or protected actions.