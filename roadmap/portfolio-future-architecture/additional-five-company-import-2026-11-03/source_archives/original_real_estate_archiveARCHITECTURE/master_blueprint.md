# Complete functional requirements baseline + added safeguards

This is a structured restatement of the extensive 125-point original discussion plus follow-on safety/architecture improvements. Numbered requirements can be converted to test cases once the build is explicitly authorized.

## A. Economics and no-loss
1. Define a realistic $5,000 minimum gross assignment spread.
2. Prefer $8,000+ where closability and risk support it.
3. Keep weak ($3–5K), acceptable ($5–8K), solid ($8–15K), strong ($15K+) classifications.
4. Compute conservative and severe-stress exits, not just headline spread.
5. Use buyer-confirmed purchase ranges rather than an online estimated value alone.
6. Score probability-adjusted economics, separately from hard financial gates.
7. Measure expected cleared dollars per time and per human effort.
8. Preserve $0 deal-side capital target; rank risk ahead of theoretical fee size.
9. Calculate maximum realistic cash exposure and unapproved legal obligation risk.
10. No property purchase, rehab, carrying, borrowing, auction bidding or guarantee by default.
11. Where any upfront deposit is required, restructure/skip by default.
12. Optional service spend must be separately approved for exact cost.
13. Track costs, fee and tax reserve independently; do not confuse gross fee with net earnings.
14. Only verified cleared bank proceeds count as received income.
15. Simulate buyer failure, seller withdrawal, title failure, extension and fee/cost surprises.

## B. Opportunity acquisition and source quality
16. Multi-source discovery: taxes, foreclosure and pre-foreclosure, probate signals, court filings, vacancy, code violations, absentee owners, tired rentals, stale listings and other lawful signals.
17. Prioritize combinations of objective distress signals.
18. Distress is not proof of motivation or authority to sell.
19. Maintain exact authoritative office by source field and county.
20. Normalize parcel IDs, owner names and property addresses with deduplication.
21. Separate assessed value, as-is value, ARV and real investor bid.
22. Detect record updates and refresh before consequential decisions.
23. Every fact carries timestamp, source, confidence and verification status.
24. Do not claim clear title based on county public search results.
25. County-specific adapters must honor published terms/access restrictions.
26. Detect and quarantine scraper/parser drift.
27. Reject invented financial/ownership values; UNKNOWN means UNKNOWN.
28. Support manual fallback when the source is down.
29. Evaluate data acquisition costs as $0-first; paid feeds are optional, not prerequisites.
30. Keep jurisdiction-aware auction/tax-lien workflows separate from assignment-first.

## C. Identity, encumbrances and due diligence
31. Resolve current owners, co-owners, estates, trusts and LLCs with evidence.
32. Detect and escalate uncertain authority to convey/sell.
33. Track mortgage, release, lien, judgment and tax signals.
34. Flag estate/probate, bankruptcy, foreclosure and court-sale deadlines.
35. Estimate equity conservatively after possible payoffs and expenses.
36. Differentiate preliminary search from professional title work.
37. Assess repair ranges by system and confidence, not a fabricated exact number.
38. Analyze lawful visual condition evidence when available.
39. Detect conflicting contracts/transfers where evidence exists.
40. Maintain curability/time/risk classifications for title problems.
41. Stop at professional legal/title review whenever required.

## D. Buyer network and price discovery
42. Build verified cash-buyer list before relying on assignments.
43. Capture buyer areas, price bands, property types, rehab tolerance and closing timelines.
44. Verify proof-of-funds status and expiry through legitimate workflow.
45. Track reliability, failed closings, retrades and payment/closing history.
46. Preselect primary and backup buyers.
47. Learn actual buyer bid/close prices, not hypothetical exit prices.
48. Use buyer demand heatmaps and market liquidity scores.
49. Do not indiscriminately blast offers to buyers.
50. Optimize for highest expected successful outcome, not nominal highest bid.

## E. Seller protection, outreach and legal controls
51. Treat sellers transparently and without exploiting vulnerability.
52. Honor owner opt-out immediately and preserve suppression.
53. Channel-specific outreach legality and consent screening before contact.
54. Verify current state/local wholesaling laws, disclosures, licensing triggers and advertising limits before live use.
55. Ohio disclosure-before-contract gate for covered residential wholesaling.
56. Separate, version and professionally review contract/disclosure templates.
57. Verify assignability before entering assignment workflow.
58. Do not sign or bind users automatically.
59. No autonomous promises to sellers or binding negotiation changes.
60. Store seller communications, deadlines and requests with provenance.
61. Show seller alternatives where appropriate; never depend on misrepresentation.
62. No unapproved personal outreach account; no mixing company identity/accounts.
63. Maintain compliance holds as hard vetoes.

## F. Contracts, title, assignment and closing
64. Start title and buyer matching in parallel once lawfully contracted.
65. Confirm escrow/title agent understands assignment closing.
66. Track inspection, earnest money, title objections, closing and termination dates.
67. Precompute required seller/James/end-buyer document checklists.
68. Prepare extension/recovery documents for human review, never auto-bind.
69. Match backup buyers when primary fails.
70. Verify legitimacy of POF and funding rather than screenshots alone.
71. Handle co-owners/estate authority/forged deeds carefully.
72. Record version hashes of signed contracts and disclosures.
73. No auto-bidding and no taking title by default.
74. Wire-fraud controls: no auto-changing disbursement instructions.
75. Validate closing statement against fee and incoming cash.
76. Keep `closed_pending_funds` separate from `funds_cleared`.
77. Mark a failed transaction as failed rather than expected income.

## G. Decision intelligence and adverse review
78. Use independent underwriter and adversarial deal-killer review.
79. No-Loss Guardian independently assesses maximum downside.
80. Compliance Guardian independently checks legality.
81. Use calibrated uncertainty and refuse false precision.
82. If buyer pricing contradicts comps, lower confidence and investigate.
83. Explain deal score and each factor.
84. Score liquidity, probability, effort, delay and risk.
85. No-sunk-cost continuation; reject bad deals even after effort/service spend.
86. Avoid contract commitments on unproven end-buyer demand.
87. Enforce a capacity limit for simultaneous live contracts.
88. Prohibit AI override of hard policy.

## H. Analytics and learning
89. Track funnel from sources to *actual bank-cleared proceeds*.
90. Analyze reasons for losing deals, not only successful ones.
91. Compare projected buyer price against actual signed buyer price.
92. Compare predicted repair range to credible actual estimates.
93. Compare predicted contract-to-close time against actual.
94. Rank source and county quality by closings, not lead counts.
95. Monitor false-positive and false-negative screening.
96. Measure opportunity cost in human time and capital risk.
97. Permit only local evidence-backed model updates.
98. Roll back locally harmful learning changes.
99. Never promote cross-project learning without Command Center-approved future mechanism.
100. Keep revenue pipeline distinct from bank income.

## I. Security and reliability
101. Least-privilege service permissions and project isolation.
102. Encrypt sensitive stored contact/contracts data.
103. Preserve append-only audit evidence for consequential state changes.
104. Idempotent duplicate prevention for outreach, document dispatch, purchases and accounting events.
105. Durable state and crash recovery from last verified action.
106. Source drift detection with fixtures.
107. Disaster backup/restore and daily consistency reconciliation.
108. Fraud checks around identity, POF, document alterations and wire changes.
109. Kill switch for outreach and live actions without data loss.
110. Change-impact analysis and rule-version tests.
111. No autonomous spend, subscription, deposit or financial transfer.
112. Approval records must be exact-amount/one-action/expiring where applicable.

## J. Workflow and dashboard
113. Use explicit state machine with default-deny transitions.
114. Preserve rejection, compliance hold, title hold, failed buyer and stale evidence statuses.
115. Single-property dossier with evidence, comps, risk, contracts, buyers and deadlines.
116. Portfolio dashboard for verified pipeline, contracts, closing readiness and cleared cash.
117. Alert on meaningful exceptions, not raw scraped lead volumes.
118. Run continuous eligible public-data monitoring, within legal/technical bounds, only once authorized to implement.
119. Prepare/review optional service-cost proposal as Approve / Skip.
120. Track urgency and seller-preferred timeline without coercion.

## K. QA / rollout / governance
121. Build project-local sandbox with fake data before touching real accounts.
122. Historical replay and adversarial bad-deal tests.
123. County adapter tests, compliance tests, state tests and no-loss tests.
124. Controlled one-unit pilot before scaling.
125. Measure actual net verified funds and risk, not activity.

### Additional project-specific improvements approved for planning
126. Place cost, monetary liability, and legal exposure on separate dashboards.
127. Distinguish optional service purchases from earnest-money/contract-side exposure.
128. Require a seller contract to be structured such that assignment and closing mechanics are professionally verified.
129. Use buyer proof-of-funds and escrow funds verification before closing-ready.
130. Compare title fee responsibility and closing funds allocation against actual settlement terms.
131. Create standardized human approval queue with exact action, scope and maximum cost.
132. Detect fee overrun/recurring charge switch at purchase time.
133. Track bank-funds receipt separate from settlement estimate.
134. Track and report reserves for potential income taxes without moving money automatically.
135. Flag unapproved personal liability even if cash deposit is $0.
136. Prevent automatic escalation of risk after failed closing.
137. Keep versioned seller fairness/complaint/dispute trail.
138. Validate document completeness including signature ordering and disclosures.
139. Make recovery branches explicit, not improvised.
140. Multi-buyer fallbacks only while legal contract deadlines/terms allow.
141. Audit who approved each protected action, with exact request hash.
142. Stop when the source field is stale, uncertain or contradictory.
143. Maintain SourceRecord evidence chain for every consequential decision.
144. Enable operator-readable explanation for rejection and manual-review holds.
145. Separate project-local audit/evidence from undefined shared ecosystem contracts.
146. Design provisional Command Center adapter as no-op/blank seam only.
147. Maintain permanent subordinate project brain hierarchy.
148. No local design may force changes to PIF.1–PIF.10 or global contracts.
149. Create 115+ anchor simulations and combinatorial variants.
150. Require 30+ explicit critical PASS/FAIL certification cases before any live pilot.
151. Set zero known bypass paths for spending, signatures, compliance and revenue recognition.
152. Independent professional Ohio licensing, disclosure, outreach and title review before live use.
153. Enforce run-time $0/free-first and prohibition on fee-bearing tool activation without approval.
154. Keep scope exclusive to this real-estate project; no mixing bank accounts, outreach identities, data or infrastructure with other portfolio projects.
155. Preserve strict initial nonexecution authorization, including despite 'continue' language in dependency audit.

### Critical caveat
The foregoing is a *planning requirements inventory*, not a claim that 155 implementation tests have been written or passed, and not a claim that any software or records system has been built.
