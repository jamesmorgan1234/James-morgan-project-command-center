# 112 — Deployment Factory

**Status:** DESIGN NOW / SELECTED BUILD NOW FOUNDATION

## Purpose
Provide a reusable, provider-neutral path from source to verified release so future companies inherit secure deployment/recovery semantics instead of creating bespoke pipelines.

## Factory capabilities
Repository/project binding; build manifest; dependency lock/SBOM; artifact identity/hash/signature; environment manifest; typed config; secret references; database migrations; preview/test/staging/production lanes; release candidate; quality/security/privacy/cost gates; approvals; canary/rolling/blue-green strategies; feature flags; health/SLO observations; promotion; rollback; release notes; incident correlation; backup/restore readiness; deprecation/retirement.

## Environment identity
Every environment declares company/project, purpose, provider/account, region, URL/domain refs, data class, customer/tenant allowance, secret namespace, database/storage refs, network policy, resource budget and release identity. Preview/staging/production must never share credentials or customer data accidentally.

## Build identity
Release candidate includes source SHA/tree, dependency lock hashes, build tool versions, environment-independent artifact hash, config schema version, migration set, protected assets hashes, test/evaluation evidence and SBOM/license metadata.

## Deployment contract
`candidate → preflight → environment lock → backup/migration readiness → deploy exact artifact → apply bounded migration → health/canary observation → verify → promote or rollback → reconcile state → release evidence`.

## Provider adapters
Hosting/cloud/container/serverless/static/mobile and future providers implement typed adapter contract: capabilities, region, cost/free tier, auth ref, deploy, status, logs, rollback, delete/retire and health. Core release logic never depends on one vendor.

## Migrations
Database/data migrations must be versioned, reversible/compensatable where feasible, tested on representative snapshots, compatibility-scoped and separately gated. Production mutation remains protected.

## Safe rollout
Canary/shadow/blue-green/rolling choices are capability/policy driven. Candidate can only advance when health, verification and compatibility gates pass. A model/Agent may recommend, not bypass a failed gate.

## Recovery
Last-known-good artifact/config/migration checkpoint; backup restore evidence; provider outage path; rollback vs roll-forward rule; DNS/certificate/domain dependencies; incident safe mode.

## DESIGN NOW
Environment/release/artifact/provider/migration identity, deployment adapter, promotion/rollback state, evidence contract, region/resource metadata and protected-action classification.

## BUILD NOW
Reconcile current Command Center Vercel/release/PWA/Category15 machinery into a generic Deployment Factory interface without deploying portfolio companies. Ensure Command Center itself is the reference implementation.

## BUILD BEFORE FIRST COMPANY
Company environment provisioning, domain/certificate binding, customer-data separation, commercial provider choices, production portfolio release dashboard and automated recovery drills.

## Acceptance
A dummy company can build one immutable artifact, deploy to an isolated disposable preview through a provider adapter, fail a canary, roll back, prove artifact identity and cleanly retire the environment without touching Command Center or another company.