# P15.1 Agency retry/recovery unresolved gaps

Qualified checkpoint before this gap record: 377 VERIFIED / 5,475 UNVERIFIED.

The following rows remain deliberately UNVERIFIED after exact review of the saved retry/recovery proof index. They are not NOT_APPLICABLE and are not treated as implementation defects without further evidence.

- `CCR-00422` — **Circuit breaker.** Existing retry budgets, blocking decisions, resource/quota gates and recovery controls do not provide a named, requirement-specific executable circuit-breaker contract sufficient for certification.
- `CCR-00423` — **Portfolio circuit breaker.** No exact portfolio-wide breaker implementation/test pair was established in this pass. Nearby portfolio/containment controls are insufficient to promote this row by similarity.
- `CCR-00424` — **Dead-letter/blocked-task handling.** Shift Manager explicitly classifies blocked tasks and durable shift records include blocker-resolution actions, but this pass did not establish the full dead-letter/blocked-task contract with exact requirement-specific executable proof. Leave UNVERIFIED.

No runtime, schema, migration, production, protected asset or authorization behavior changed in this review. These rows are parked to avoid rediscovery loops while P15.1 continues.
