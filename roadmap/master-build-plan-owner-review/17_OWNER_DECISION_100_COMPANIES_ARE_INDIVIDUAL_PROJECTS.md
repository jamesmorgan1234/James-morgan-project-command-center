# Owner Decision — The 100 Future Companies Are Individual Command Center Projects

**Owner:** James Morgan  
**Date:** 2026-10-24  
**Status:** LOCKED OWNER ROADMAP DECISION  
**Applies to:** the canonical 100-company future portfolio directive and all future Command Center architecture/implementation derived from it.

## Decision

Every one of the canonical 100 future companies is its **own independent Command Center project**.

Each company must have its own:

- stable project ID;
- project record;
- project button / project entry surface;
- detail view;
- roadmap and version lineage;
- checkpoints and evidence;
- Brain/domain-pack references;
- Agent/Agency references;
- status, priority, health, blockers, Needs Me state and approvals;
- data/security/integration/billing/deployment/observability references;
- authorization scope and incident history.

## Grouping rule

The 100 projects may be presented beneath one organizational category/umbrella, similar to the established Books pattern.

Example navigation:

`Projects → Future Companies / 100-Company Portfolio → [individual company project buttons]`

The umbrella/category exists only for navigation, organization, search/filtering and portfolio rollups.

It is **not** itself a substitute for the 100 independent project identities.

It must never:

- merge the 100 into one project;
- flatten independent roadmaps/history;
- collapse Brain or Agent state;
- share authorization merely because projects share a category;
- share credentials/data/memory/accounts merely because projects share a category;
- cause project renaming/reorganization to rewrite stable project IDs;
- hide an individual company from the standard Command Center project lifecycle.

## Canonical analogy

This follows the same principle already recorded for Books in `supabase/migrations/20261023_individual_books_single_umbrella.sql`: the organizational umbrella/category is only an umbrella; each contained item remains its own project.

## Architecture classification

**DESIGN NOW.**

Reason: current clean-room `ProjectRecord` already supports an optional `companyId`, but no explicit organizational container/category relationship is present in that TypeScript contract. Grouping must therefore be added as metadata/relationship without corrupting project identity.

Expected architecture:

- Project = first-class execution/roadmap/Brain/Agency/security unit.
- Company = company identity linked to exactly the relevant project(s), with each canonical future company initially represented by its own primary project.
- Portfolio/category/container = organizational/navigation relationship only.
- Portfolio rollups = derived aggregation across project IDs; never the authoritative state of an individual company project.

## Execution boundary

This decision does **not** authorize creating or activating the 100 company projects in production now.

It authorizes designing Command Center so that, when a company is later authorized, it can be created as a first-class project with its own button and isolated state without architectural reconstruction.

No future company launch, customer creation, paid service, spending, outreach, domain purchase, production deployment or legal/financial action is authorized by this decision.
