# Agent Mode Background Runner Standard

The Command Center Agent Mode background runner is a normal-chat-first polling bridge. It exists to wake durable Agent sessions without requiring James to reopen project chats.

## Execution model

- Runner cadence is hourly unless the product later exposes a verified faster free trigger.
- Only one primary Agent execution lane is processed at a time.
- Current verified Command Center state is authoritative.
- Project-only sessions remain hard-locked to their one named project.
- Explicit multi-project sessions may use only their listed projects.
- Books remain explicit-target-only.
- Every meaningful state change is checkpointed.

## Cost and capability rules

- The runner must remain $0/free-first.
- It must not purchase, subscribe, start paid trials, enable usage billing, consume paid API credits, or authorize ads.
- A free introductory balance may be used only after the exact live zero-cost allowance is verified and the provider cannot automatically charge beyond it.
- Built-in normal-chat tools and already-connected free capabilities take priority over Work.
- Work is considered only after the normal-chat exhaustion gate proves a concrete capability gap.
- GPT-6.1 Sol Medium is the Agent Mode ceiling and is approval-required for the exact step.
- Astra is prohibited inside Agent Mode.

## User/device boundaries

When James must act, the runner records a user-only blocker with exact instructions and one of these required environments:

- `pc`
- `phone`
- `local_browser`
- `any_device`

A PC-only task must be surfaced prominently as `PC REQUIRED`. A user acknowledgement such as `I completed this` never counts as downstream proof. It only moves the step to verification-pending. Agent Mode must verify the real result before advancing.

## Tool health

The runner writes truthful capability health into `agent_tool_registry` through the service-only gateway. Availability is never inferred from a past chat. Temporary failures may be retried only under the locked retry circuit-breaker policy.

TinyFish Search/Fetch may be treated as free only under its verified free terms. TinyFish Agent/Browser are metered capabilities and must remain unavailable to automatic routing unless a current zero-cost allowance and non-billing boundary are verified.

## Work handoffs

If a Work step is irreducible, the runner prepares it through the service Work handoff gateway. It may not bypass Work concurrency, retry, duplicate-side-effect, model-ceiling, or Security authorization rules. If no verified Work executor is available, the handoff remains safely queued/proposed/approved as appropriate and the runner reports the real blocker rather than pretending Work ran.

## Notifications

The runner stays silent when there is no work or when safe progress requires no user decision. It surfaces only meaningful completion, Sol Medium approval, a genuine blocker, or a user/device action requirement.
