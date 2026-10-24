# 113 — Testing & Evaluation Factory

**Status:** DESIGN NOW / BUILD NOW FOUNDATION

## Purpose
Create one reusable quality system for software, Brains, Agents, deterministic services, data contracts, workflows and future company products. Verification evidence is independent from implementation whenever risk requires it.

## Test layers
- schema/type/static analysis;
- unit/state-machine;
- contract/API/event/data-contract;
- integration/provider-adapter;
- workflow/end-to-end;
- visual/reference;
- accessibility;
- localization;
- browser/device/platform compatibility;
- performance/load/soak;
- resilience/chaos/recovery;
- security/privacy/permission;
- supply-chain;
- migration/rollback/restore;
- financial-calculation/reconciliation;
- policy/authorization;
- AI/Brain/Agent evaluations.

## AI evaluation families
Correctness; source/provenance use; unsupported certainty; hallucination; reasoning outcome; tool selection; tool parameters; policy compliance; prompt injection; data leakage; cross-company leakage; memory scope; model/provider fallback; cost; latency; context overflow; downgrade; adversarial inputs; multilingual/multimodal; human-judge calibration.

## Evaluation identity
Every result binds test/eval ID, version, subject version, environment, fixtures/data version, evaluator/model/rubric version, expected result/threshold, actual result, confidence where probabilistic, artifacts/logs, verifier identity and timestamp.

## Independent verification
High/critical risk requires verifier different from builder/executor. Evaluation Agents can prepare evidence, but protected release/financial/security acceptance uses deterministic gates and/or authorized independent human/domain review as specified.

## Fixture factory
Synthetic/redacted fixtures with stable seeds/versions, sensitive-data restrictions and cleanup. Production customer data is never default test data. Golden fixtures preserve known edge cases and regressions.

## Replay
Commands/events/Agent choices/workflow steps can be replayed in non-side-effect fixtures with captured time/random/provider responses. Replay cannot perform real protected side effects.

## Regression corpus
Every resolved bug, incident, security finding, false model output and recovery failure becomes candidate regression evidence. Promotion requires relevant historical regressions remain green.

## Quality gates
Company/module/Brain/Agent manifest declares mandatory gates. Missing evidence = not verified. A flaky/non-deterministic test must be classified/repaired rather than silently ignored.

## BUILD NOW
Unify existing clean-room tests, Agency independent verification, Brain adversarial tests, Category 15 gates and future portfolio requirements under one test/evaluation manifest/registry. Add evaluator version/confidence/calibration and human-review/appeal states where absent.

## BUILD BEFORE FIRST COMPANY
Company test-pack provisioning, isolated runners, cross-company fixture isolation, production-like staging, customer-facing quality evidence where appropriate and distributed load/soak capacity.

## Acceptance
A dummy Brain and Agent, deterministic billing calculator, data contract and web UI can each declare their required gates; the factory runs the correct test types, preserves evidence, rejects a regressing version and proves no test creates a real protected side effect.