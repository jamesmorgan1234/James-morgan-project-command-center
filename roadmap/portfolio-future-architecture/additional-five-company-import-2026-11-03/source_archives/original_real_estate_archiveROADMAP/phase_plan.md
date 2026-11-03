# Roadmap — only project-local planning authorized

Phases 0–16 can be specified and, **after separate start authorization**, implemented wholly project-locally. Live activity requires additional permissions. Command Center integration remains HOLD until its audit resolves PIF.1–PIF.10 and the shared contracts.

| Phase | Deliverable | Dependencies | Command Center class | Exit condition |
|---|---|---|---|---|
| 0 | Constitution / authority / spend + no-loss gates | none | SAFE TO CONTINUE | No conflicting project rules; all protected actions identified |
| 1 | Subordinate domain brain and specialists | 0 | SAFE TO CONTINUE | Each specialist has inputs, outputs, vetoes, authority |
| 2 | Canonical local schemas / state machine | 0–1 | SAFE TO CONTINUE | typed fields, relationships, default-deny transitions |
| 3 | County source/adapter framework | 2 | SAFE TO CONTINUE | provenance, freshness, drift and test fixtures |
| 4 | Property identity, owners and equity | 3 | SAFE TO CONTINUE | conflicts, duplicates and unknowns handled |
| 5 | Valuation / repairs / comps | 3–4 | SAFE TO CONTINUE | ranges, confidence and disagreement tests pass |
| 6 | Buyer market intelligence | 2–5 | SAFE TO CONTINUE | criteria, reliability, bids, proof of funds model |
| 7 | Economics / stress / no-loss / adversarial | 4–6 | SAFE TO CONTINUE | floor/capital gates and downside tests pass |
| 8 | Ohio + configurable state compliance | 2,7 | SAFE TO CONTINUE local | disclosures, outreach, law packs and review holds tested |
| 9 | Seller workflow | 7–8 | SAFE TO CONTINUE | no bypass of compliance and economics |
| 10 | Document / contract intelligence | 8–9 | SAFE TO CONTINUE | assignability, signatures, templates, deadlines, approvals |
| 11 | Title workflow | 10 | SAFE TO CONTINUE | preliminary search distinct from professional title |
| 12 | Buyer matching / assignment | 6,10–11 | SAFE TO CONTINUE | primary + backup, POF, assignments and vetoes |
| 13 | Closing and funds | 11–12 | SAFE TO CONTINUE | closing-to-cleared reconciliation and no fake revenue |
| 14 | Local fraud, security, recovery | cross-cutting | SAFE WITH BOUNDARY | local safe behavior without defining shared security |
| 15 | Project-local analytics and learning | 13–14 | SAFE WITH BOUNDARY | local improvements and evidence, no global promotion |
| 16 | Simulation and certification | 0–15 | SAFE TO CONTINUE | 115 anchors + >=250 case variants, 30 critical tests; no severity-1 bypass |
| 17 | Controlled live pilot | 16 + explicit James approval + professional compliance review | separate live authorization | actual legally approved pilot results |
| 18 | Expanded counties/volume | proven 17 | separate authorization | jurisdiction regression and metrics |
| 19 | Command Center integration | CC final PIF/architecture | HOLD FOR COMMAND CENTER | only then implement approved CC-facing contract |

## Critical path
0 -> 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9 -> 10 -> 11 -> 12 -> 13 -> 14 -> 15 -> 16 -> [separate approval + professional review] -> 17 -> 18.

19 is independent after Command Center governance approval; it is never defined by this project's unilateral schema choices.

## Current status
Planning concepts for 0–16 and local source/rule/test design drafted in chat and archive; executable implementation, source adapters, database tables, runtime brain, QA runs, and deployments **not started**. No external user accounts or systems changed.
