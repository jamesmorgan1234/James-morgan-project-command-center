# Command Center Product Roadmap

Status: authoritative implementation roadmap for the current Command Center application.

## Product rule
Command Center is the owner-controlled control plane for James Morgan's projects. Normal Chat is the default execution brain. Nothing autonomous runs unless the owner enables AUTO. No feature may spend money, publish, accept legal terms, cross protected security boundaries, or enter Work outside the existing authorization gates.

## 1. Primary mobile layout

### Global header
- Command Center identity
- private sync / last refresh state
- AUTO OFF / AUTO ON owner control
- background runner health
- visible attention state when an Agent needs James

### Home
Primary cards remain the approved four-card layout:
1. Projects — complete tracked portfolio
2. Next Up — current action queue
3. Agent — owner-controlled Agent Mode
4. Revenue — verified revenue only

Directly beneath the primary cards, expose the Command Center control modules without replacing the approved primary layout:
- Brain
- Automation
- Integrations
- Analytics
- Security
- Deployment

### Projects
- portfolio summary
- search/filter where applicable
- project cards with verified status and scope progress
- project detail with performance, Books/publication data when relevant, current snapshot, Agent controls, opportunities, next step, blocker, and continuation state

### Next Up
- prioritized project action queue
- Command Center Brain / capability roadmap entry
- no invented priority or completion

### Agent
Owner controls:
- project selector
- AUTO OFF / AUTO ON
- This Project Only
- Next Work Boundary
- Manual Task
- Project Checkpoint
- Pause after safe action
- Resume
- Stop Agent / cancel unstarted work
- Refresh state
- Approve Work for exact step
- Approve Sol Medium for exact step only

Agent status must show:
- current project
- current task
- next queued task
- run status
- verified steps
- checkpoint time
- user action / PC REQUIRED when applicable
- runner health
- Work rung and approval state
- Work allowance N/A unless verified

### Revenue
- verified revenue total
- project-by-project verified revenue
- N/A where live revenue is not verified
- test orders never count as revenue

## 2. Control modules

### Brain
- durable project memory
- context packets
- brainstorm workspace
- project plans
- task queue / planner
- handoff builder
- project roadmaps
- source truth / recovery context

### Automation
- schedules
- condition watches
- notifications
- completion state
- pause/disable controls
- no autonomous spending

### Integrations
- connected services
- source status
- email/data integrations
- connection verification
- missing-connection state

### Analytics
- verified KPIs
- project performance
- progress
- revenue
- source freshness
- never fabricate missing metrics

### Security
- owner authorization
- permission envelopes
- protected-action gates
- Work approvals
- Sol Medium exact-step approval
- security escalation boundaries

### Deployment
- release state
- hosting state
- QA status
- rollback/recovery controls
- release manifest

## 3. AUTO contract
AUTO is a separate owner switch from Agent session existence.

AUTO OFF:
- scheduled runner may wake as infrastructure heartbeat, but must receive zero runnable Agent sessions
- no Agent job execution
- no job switching
- manual owner actions remain available

AUTO ON:
- background runner may process only eligible scoped sessions
- one primary Agent session at a time
- may move to another eligible queued session only after the current safe unit is complete or blocked
- all project scope, Books target, spending, security, user-only, Work, and duplicate-side-effect gates remain enforced

Default and missing state: OFF.

## 4. Function truth rules
- Current verified database state outranks stale history.
- No invented revenue, metrics, permissions, account connections, completion, or external actions.
- Every production side effect needs evidence before completion.
- User-only actions must identify the required device and exact action.
- Books are explicit-target-only.
- Work is a capability boundary, not a convenience path.
- Astra is prohibited in Agent Mode.
- Sol Medium is the maximum Agent Work rung and requires exact-step owner approval.
- No purchases, subscriptions, trials, credits, API billing, ads, or paid infrastructure without explicit authorization for that exact spend.

## 5. Implementation order
1. Owner AUTO gate in Supabase — implemented; defaults OFF.
2. Surface AUTO control in the approved UI and Agent screen — implement and verify.
3. Surface Brain/Automation/Integrations/Analytics/Security/Deployment from the approved home without replacing the locked primary cards.
4. Unify runner health + AUTO state so “active” never means Agent execution is authorized when AUTO is OFF.
5. Add UI regression QA for the control surface, AUTO fail-closed behavior, and approved four-card layout preservation.
6. Verify GitHub Pages deployment and installed-PWA cache delivery.
7. Audit every visible button against a real handler/RPC and remove or mark any dead control.
8. Audit every module against its standard and database truth source.
9. Final mobile QA: navigation, back behavior, touch targets, safe-area spacing, loading/error states, offline fallback, and stale-cache recovery.

## 6. Definition of done
Command Center is complete only when the owner can open the installed app and, without hidden developer steps:
- see the approved home layout
- reach every control module
- turn AUTO on/off and see the true durable state
- start, pause, resume, stop, and inspect Agent runs within scope
- receive clear user-action and Work approval gates
- inspect projects, next actions, verified revenue, Brain, Automation, Integrations, Analytics, Security, and Deployment
- refresh and recover from stale PWA cache
- use every visible button successfully or receive an accurate explicit unavailable/blocked state
- observe no background Agent execution while AUTO is OFF
