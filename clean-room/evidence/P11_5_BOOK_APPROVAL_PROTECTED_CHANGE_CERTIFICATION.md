# P11.5 — Owner Approval and Protected-Change Gates — Repair and Certification Evidence

## Roadmap scope
Capture title/subtitle/cover/artwork/manuscript/interior/metadata/pricing/format/rollout/complete-series-cover/package/protected-asset approvals and exact reopen/change authority. Discussion, brainstorming, inspection, recommendations, or generated alternatives must not mutate locked state.

## Locked exit gate
Approved state changes only from explicit owner action with lineage.

## Files inspected
- `clean-room/src/books/approvals.ts`
- `clean-room/tests/p11-5-book-approvals.test.mjs`
- `supabase/migrations/20261026120000_p11_5_book_approvals.sql`

## Existing implementation preserved
P11.5 implementation commit: `0bb45a6caa7e118e9dc6005f88dfff64cb2689aa` (`p11.5: require explicit owner approval and protected change authority`). Existing exact approval target/version checks, supersession lineage, explicit owner actions, protected-change authorization, and discussion fail-closed behavior remain intact.

## Gap proven in current roadmap
The inherited approval contract covered only `title`, `cover`, `manuscript`, and `rollout`, with decisions `approve`, `reject`, and `reopen`. The current locked roadmap requires additional approval targets and the explicit lifecycle states proposed/draft/reviewed/approved/locked/reopened/superseded/rejected.

## Repair
Added an additive protected approval lifecycle rather than replacing the existing ledger:
- `clean-room/src/books/approval-state.ts`
- `clean-room/tests/p11-5-book-approval-state-machine.test.mjs`
- `supabase/migrations/20261027233300_p11_5_protected_book_approval_state.sql`
- exported from `clean-room/src/books/index.ts`

The repair adds all required approval kinds and a fail-closed state machine with exact current-event supersession, monotonic target versions, observation ordering, owner-governed protected transitions, exact target identity/version locks, and immutable history.

Owner evidence is mandatory when entering approved/locked/reopened/superseded/rejected states and whenever changing away from an approved or locked state. Approved/locked target identity or version cannot change except through explicit reopen or supersession. Initial reopened/superseded states are rejected because they have no lineage.

## Focused tests added
The new focused test proves:
- every required approval target is representable;
- approve/lock/reopen/supersede transitions require explicit owner evidence and exact lineage;
- locked identity/version cannot change silently;
- discussion/brainstorming/generated alternatives cannot mutate protected state;
- durable SQL history covers all required kinds/states and remains immutable/owner-scoped.

The inherited P11.5 test continues to prove exact owner approval, explicit supersession, protected-change authorization binding/expiry, discussion fail-closed behavior, and immutable durable evidence.

## Protected boundaries
No approved book asset or rollout was changed by this platform repair. No real KDP/provider action occurred. The migration is repository-only and was not applied to production. No Category 12 work was started.

## Checkpoint entering repair
- HEAD: `5a03c3616b49e8ff0d0dfdd6ac913ea738355be3`
- tree: `83ed2bff451278ea552c2d7a546e6e768f7b68cd`

Fresh exact-head QA is required for this executable repair before P11.6 proceeds.
