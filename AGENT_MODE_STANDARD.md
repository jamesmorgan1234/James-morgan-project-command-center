# Command Center Agent Mode standard

Agent Mode is bounded, auditable execution over already completed Command Center capabilities. It does not create a second competing execution system and it does not weaken project, Security, Deployment, publishing, account, quality, or checkpoint gates.

## Eight Agent Mode phases

1. **Agent Session Model** — create an owner-scoped run with an explicit goal, project scope, permission envelope, execution policy, and durable state.
2. **Goal Intake** — convert a user-approved objective into a structured objective without silently expanding scope.
3. **Step Executor** — execute one eligible step at a time through already-supported Command Center execution paths.
4. **Tool Permission Gate** — block every tool/action outside the run’s explicit permissions or protected boundaries.
5. **Verification Gate** — require real evidence that a step succeeded before it counts complete or the agent advances.
6. **Checkpoint & Resume** — persist exact run/step state, evidence, blockers, and the next resumable action.
7. **Failure Recovery** — retry/resume only the failed or incomplete unit and never duplicate a verified side effect.
8. **Cross-Project Agent Runs** — coordinate multiple explicitly selected projects while preserving each project’s independent checkpoints, locks, permissions, and quality gates.

## Core execution rule

Agent Mode follows:

**normal chat / native Command Center capabilities first → smallest genuine capability boundary → verify → return to normal chat**

A tool is not permitted merely because it is convenient. A model or environment preferring a different workflow, finding a task tedious, or declining to make a best effort is not a capability boundary.

Before requesting Work, Agent Mode must establish that the exact blocked operation cannot be completed by the normal-chat/Command Center capabilities currently available for that task. Repository work, database work, research, reasoning, coding, testing, QA, file creation/editing, generation, and connected-tool actions remain normal-chat work whenever the available normal-chat tools can perform them safely.

## Normal-chat reasoning policy

For substantive Agent Mode execution that remains in normal chat, the required reasoning policy is **High** by default. Agent Mode should maximize normal-chat capability before considering Work.

This is a Command Center execution policy, not a claim that Command Center can silently change a ChatGPT product/model selector that the current interface does not expose programmatically. If the product requires the user to select a reasoning setting manually, Agent Mode must surface that requirement rather than pretending it changed the setting.

Reasoning level never overrides authorization. High reasoning does not authorize spending, destructive changes, publication, legal acceptance, security/account actions, or any other separately protected action.

## Work is a scarce protected resource

Work usage is shared and limited across projects. Agent Mode must conserve it as a scarce resource.

Agent Mode may not:

- hand an entire project to Work merely because one sub-step is blocked;
- send work to Work when normal chat can perform it;
- automatically choose the strongest Work model because the overall project is large;
- fan many projects into Work concurrently merely because they are available;
- claim to know total remaining Work allowance when Command Center does not have a trustworthy account-wide usage source;
- invent percentages such as “this should use 5%” or “90% remains” without a verified usage signal;
- treat long duration as proof that a high-capability Work model is required.

The Work boundary is the **smallest independently useful blocked operation**. When that narrow operation completes, its returned evidence is verified and the run immediately resumes in normal chat.

If another genuine Work-only blocker appears later, Agent Mode may prepare another narrow handoff instead of leaving the entire project in Work.

## Current Work model ladder

The current user-visible Work choices are:

1. `GPT-6 Luna High`
2. `GPT-6.1 Sol Light`
3. `GPT-6.1 Sol Medium`
4. `GPT-6 Astra Light`
5. `GPT-6 Astra Medium`

Agent Mode uses a **least-sufficient-capability** policy. The ladder is for conservation; it is not a promise of exact usage percentages because actual Work consumption varies and Command Center does not currently have a verified account-wide Work usage meter.

### GPT-6 Luna High

Preferred for narrow, repetitive, low-reasoning Work-only operations such as straightforward browser navigation, clicking, uploading already-prepared files, copying verified values, simple forms, and repeated mechanical account-bound steps.

### GPT-6.1 Sol Light

Use when the blocked Work-only operation still has limited scope but needs modest interpretation, branching, or troubleshooting beyond mechanical navigation.

### GPT-6.1 Sol Medium

Use for moderate multi-step Work-only execution, nontrivial debugging/interpretation, or workflows where Luna/Light are not reasonably sufficient.

### GPT-6 Astra Light

Use for difficult Work-only reasoning, technical investigation, or execution that genuinely needs stronger capability but does not justify the highest allowed Work setting.

### GPT-6 Astra Medium

Highest current Agent Mode Work rung. It is never the default. Use only when the exact blocked operation genuinely requires it or lower rungs have proved insufficient. Substantial or open-ended use at this rung requires conspicuous user approval.

If the available Work choices later change, Command Center must not invent a replacement. Update this ladder from the verified current product UI before relying on a new option.

## Work decision algorithm

For every proposed Work handoff:

1. **Can normal chat / Command Center do it?** If yes, Work is forbidden.
2. **What exact operation is blocked?** Isolate the smallest useful boundary.
3. **Why is Work required?** Record the concrete capability-boundary reason.
4. **Can adjacent tiny blockers from the same authorized scope be safely batched?** If yes, batch them without broadening scope.
5. **What is the least-sufficient Work model?** Select from the current ladder based on the blocked operation, not overall project size or duration.
6. **Is another Agent Mode Work handoff outstanding?** Prefer completing/reconciling the existing handoff before starting unrelated Work unless the user explicitly authorizes concurrency.
7. **Is the Work request substantial, open-ended, high-capability, or cross-project?** Require explicit approval.
8. **Record the handoff before it starts.** Preserve project, step, model, reason, scope, approval, and start state.
9. **Verify the returned result.** Work completion is not trusted merely because a handoff says it finished.
10. **Return immediately to normal chat.** Continue from the verified returned state.

## Work approval default

Default Work policy is **ask before Work consumption**.

Agent Mode may automatically prepare a handoff proposal, but it does not silently consume Work. The approval surface must show:

- project/run;
- exact blocked step;
- why normal chat cannot complete it;
- proposed Work model;
- workload class (`micro`, `small`, `moderate`, `substantial`);
- whether another Agent Mode Work handoff is outstanding;
- exact bounded scope Work may perform;
- account-wide remaining Work allowance as `N/A` unless a trustworthy usage source is connected.

The user may later explicitly authorize a broader automatic Work policy. Ordinary high-level completion commands do not imply unlimited Work permission.

## Work handoff ledger

Command Center records only what Agent Mode itself can verify about Work usage:

- agent session and step;
- project;
- capability-boundary reason;
- selected model;
- workload class;
- bounded handoff instructions;
- approval state;
- start/end times when known;
- handoff state (`proposed`, `approved`, `in_progress`, `returned`, `verified`, `failed`, `canceled`);
- returned evidence/result summary;
- whether normal-chat execution resumed.

This ledger is **not** the OpenAI account billing/usage meter. It must never be presented as total remaining Work allowance unless a future verified platform usage source explicitly supports that claim.

## Tool permission and protected boundaries

Every Agent Mode step has a tool category and risk class. It may execute only when the session explicitly allows that category and every underlying project/system authorization is satisfied.

At minimum these remain protected boundaries:

- spending, subscriptions, credits, paid APIs, ads, purchases, or trials;
- legal acceptance or attestations;
- account creation, identity verification, MFA/CAPTCHA/security recovery, credential changes, or account ownership decisions;
- destructive or irreversible data operations;
- public communications, publishing, production deployment, or reputation-impacting actions unless already included in an explicitly authorized high-level completion unit and all underlying gates pass;
- security permission escalation;
- locked/approved asset replacement;
- book publishing when required humanization/quality/subtype gates are not verified;
- Work usage outside the current approved Work policy.

Agent Mode coordinates protected actions only through the existing Security, Automation, Integrations, Deployment, and project-specific gates that own those actions. It never bypasses them.

## Verification gate

A step is not complete because an executor returned success text. Agent Mode must verify the result against the canonical evidence source appropriate to the action, such as:

- database row/state;
- Git commit/PR/deployment run;
- connected-provider record;
- published/live artifact;
- verified checkpoint;
- approved file/hash;
- Automation run/result;
- Integration write result;
- Security authorization/audit evidence.

If evidence cannot prove completion, the step remains `verification_pending`, `blocked`, or `failed` rather than being promoted to verified.

## Checkpoint & resume

Agent state is durable. A checkpoint records:

- session goal and authorized project scope;
- current/first-incomplete step;
- verified step IDs;
- failed/blocked step IDs;
- tool/permission envelope;
- Work handoff state;
- known-good checkpoint references;
- evidence;
- exact next valid action;
- actions forbidden on resume.

On interruption, recover the latest Agent checkpoint, reconcile downstream live state, preserve verified side effects, and resume from the first incomplete step. Never restart the whole run solely because the chat/session ended.

## Failure recovery

Retries are idempotent and bounded. Agent Mode must not duplicate sends, writes, uploads, deployments, publications, account actions, generation batches, or other externally visible side effects.

If a lower Work rung fails because capability was insufficient, reconcile that handoff first. Agent Mode may then propose the next sufficient rung rather than jumping directly to the maximum setting.

## Cross-project runs

Cross-project execution requires an explicit list of included projects. Agent Mode may not interpret “everything” as permission to launch every project into external tools or Work simultaneously.

Each project retains its own canonical checkpoint, locks, quality gates, protected resources, and first incomplete unit. Cross-project coordination changes ordering and orchestration; it does not merge project truth.

## Books and other quality-gated projects

Agent Mode consumes verified project roadmaps and `required_gates`. For Books, `BOOK_PROJECT_ROADMAP_STANDARD.md`, `BOOK_QA_GATES_STANDARD.md`, and Deployment publishing gates remain mandatory. Agent Mode cannot mark a manuscript/book publishable while humanization, continuity, originality, colorability, recipe accuracy, image match, layout, locked-asset, or other applicable gates remain incomplete.

## No fake autonomy

If an external capability is unavailable, disconnected, not authorized, or requires user action, Agent Mode records the real blocker. It must not claim a step ran, an account connected, a Work job started, a message sent, a book published, or a deployment completed unless the corresponding evidence exists.