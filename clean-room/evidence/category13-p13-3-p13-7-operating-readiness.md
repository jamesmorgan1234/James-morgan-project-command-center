# Category 13 / P13.3–P13.7 — Operating Readiness Evidence

Status: implemented and locally verified on the isolated clean-room branch. This work does not deploy, enable a production rollout, invite external beta users, or activate paid infrastructure.

## P13.3 Core journeys
CoreJourneyInstrumentation emits schema-valid, privacy-governed start/success/failure events for all ten mandatory journeys. Focused tests prove all ten can emit start + terminal success evidence.

## P13.4 Operating dashboard
buildOperatingDashboard exposes onboarding funnel, Project-run success/failure/latency, connected-app failures, Import failures, dot activity, support volume, and confirmation frequency.

## P13.5 Rollout ladder
ROLLOUT_LADDER defines all six stages with owner, promotion gates, rollback thresholds, and explicit production-authorization marking for limited-invited and later stages.

## P13.6 Kill switches / rollback
Fail-closed kill-switch evaluation exists for automation, connectors, dots, and experts. Rollback playbooks cover feature regression, connector incidents, automation/dot incidents, expert incidents, and data-integrity incidents.

## P13.7 Rehearsals
Eight required launch scenarios are codified with expected containment, escalation, and pass criteria. rehearsalPasses requires evidence for all defined expectations.

Focused local verification before repository mutation: TypeScript 5.8.3 strict compilation PASS; Category 13 focused suite 14/14 PASS.

Real P13.8 beta evidence, P13.9 staged rollout evidence, and P13.10 launch/steady-state evidence remain external execution stages and must not be fabricated.
