# Category 13 / P13.1 — Analytics and Measurement Schema Evidence

Status: implemented on the isolated clean-room branch; no production deployment or provider-side analytics activation is part of this phase.

## Canonical schema

`src/analytics/measurement-schema.ts` is the canonical P13.1 event/KPI dictionary.

It defines:

- versioned analytics event names and a typed event envelope;
- identifier taxonomy with explicit pseudonymous/internal-reference requirements;
- mandatory instrumentation targets for onboarding, Import setup, connected-app setup, Project creation, source attachment, Project run, expert attachment, dot creation, dot activity, and support path;
- success/failure and latency measurement semantics;
- conversion definitions for every mandatory core journey;
- D1, D7, and D30 retention definitions tied to pseudonymous subjects;
- an executable completeness assertion that fails if a mandatory journey loses start/success/failure coverage or conversion mapping;
- payload-property allowlists at the event-definition layer so schema drift is rejected rather than silently accepted.

## Verification

`tests/category13-measurement-schema.test.mjs` verifies:

1. all ten required core journeys have registered start, success, and failure instrumentation;
2. each journey has a completion KPI and conversion definition;
3. identifier privacy classification is explicit;
4. valid allowlisted payloads pass and undeclared payload properties fail;
5. run identifiers required by Project-run events cannot be blank;
6. D1/D7/D30 retention windows are explicit and use the pseudonymous subject identifier.

Local isolated compile/test proof before repository mutation:

- TypeScript 5.8.3 strict compilation: PASS.
- P13.1 focused Node tests: 4/4 PASS.

The repository-wide clean-room gates remain the authority for integration verification after the commit lands.
