# Company 084 — Email Deliverability Autopilot

**Company ID:** `company:future:084`  
**Primary project:** `project:company:future:084`  
**Roadmap version:** `COMPANY-084-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no bulk sending, warm-up scheme, DNS change or marketing execution.

## Business identity
Purpose: continuously measure and improve the technical health of legitimate permission-based email delivery without enabling spam or abusive bulk messaging.

## Product tree
Domain Authentication Monitor; SPF/DKIM/DMARC Analyzer; Domain/IP Reputation Monitor; Bounce/Complaint Monitor; Suppression Health; Blocklist Monitor; Sending-Pattern Analyzer; Provider/Inbox Placement Tests; Alignment/Route Analyzer; Delivery Score; Incident Alerts; Remediation Planner; Postmaster/Feedback Integration; Transactional-vs-Marketing Separation; Dedicated/Shared IP Analysis; Change Verification; API/SDK; Enterprise/Private Deployment; ESP Packs.

## Feature/customer/vertical tree
Features: sending domain/subdomain, provider/account, SPF/DKIM/DMARC state, selector/version, IP/pool, bounce types, complaint rates, suppression state, volume/rate, engagement trends, blocklists, inbox/spam placement samples, reputation signals, route, incident and remediation evidence.
Customers: legitimate SaaS, ecommerce, marketplaces, support systems, transactional-email apps, enterprises, newsletters with consent, agencies managing authorized senders and ESP customers.
Verticals: transactional auth/receipts, support, lifecycle/product messaging, opted-in marketing, marketplaces and notifications. Abuse/spam is prohibited.

## Brain capability / architecture
Brain may diagnose likely causes and recommend safe changes. Deterministic DNS/authentication parsing, provider metrics and policy thresholds own health state. Architecture: domain/sender registry, DNS monitor, ESP/postmaster adapters, event analytics, reputation/blocklist collectors, placement test harness, incident state machine and remediation evidence.

## Agent tree
Authentication Agent; Reputation Agent; Bounce/Complaint Agent; Suppression Agent; Placement Agent; Routing Agent; Incident Agent; Remediation Planner; Compliance/Consent Liaison; QA Agent.

## Deterministic services
SPF/DKIM/DMARC parsers; DNS verification; bounce taxonomy; complaint/suppression rules; rate/volume metrics; blocklist checks; domain alignment; alert thresholds; change tracking; provider health.

## Workflow
Register authorized sender → verify DNS/authentication → ingest delivery/bounce/complaint/suppression telemetry → detect degradation → classify likely source → recommend technical/consent/list remediation → protected DNS/provider change if needed → verify metrics and placement over time → close incident with evidence.

## Integrations / API / data
DNS/domain systems, legitimate ESPs, postmaster/feedback services, suppression systems, CRM/marketing platforms where authorized, analytics and SIEM. Data: sender metadata, DNS/auth state, aggregate delivery events, reputation/placement metrics and incidents; minimize recipient PII.

## Monetization / distribution
Domains/senders, message volume monitored, provider accounts, seats, enterprise/private, API and managed deliverability consulting software. Distribution via ESP/SaaS/ecommerce/agency ecosystems.

## Security/privacy/compliance
Require authorized sender ownership, consent/suppression respect, no evasion of provider anti-abuse controls, no purchased-list or spam optimization. Protect recipient and provider data; DNS/provider changes remain protected.

## Failure / edge cases
DNS propagation, forwarded mail affecting DMARC, provider metric lag, shared IP neighbor reputation, sudden legitimate volume spike, new domain, corporate filtering, temporary blocklist, soft vs hard bounce, complaint feedback gaps, mailbox-provider policy change.

## Scale / overlap
One domain → multi-brand enterprise → deliverability health platform. Overlap #83 domain/DNS, #64 inbox, communications systems. #084 owns sender deliverability health.

## Classification
**DESIGN NOW:** domain/sender/account isolation, consent/suppression metadata, provider health, expiring DNS/key resources and communication evidence.  
**BUILD NOW:** Command Center future communication factory should track sender identity/domain/provider separately by company.  
**BUILD BEFORE FIRST COMPANY:** sender-domain/authentication monitoring before any portfolio company relies on email at scale.  
**COMPANY-SPECIFIC LATER:** customer ESPs/placement network/commercial service.  
**SCALE-ONLY:** large global placement/reputation observatory.

# Mandatory 24-part completion block
1. Product Tree: auth/reputation/bounce/complaint/suppression/blocklist/patterns/placement/alignment/score/alerts/remediation/feedback/API.
2. Feature Tree: domain/provider/SPF/DKIM/DMARC/IP/bounces/complaints/suppression/volume/placement/reputation/incidents/evidence.
3. Customer Tree: SaaS/ecommerce/marketplaces/support/transactional/enterprise/consent newsletters/agencies/ESPs.
4. Vertical Tree: transactional/support/lifecycle/authorized marketing/marketplace/notifications.
5. Brain Tree: diagnosis/recommendation; health facts deterministic/provider-derived.
6. Agent Tree: auth/reputation/bounce/suppression/placement/routing/incident/remediation/compliance/QA.
7. Service Tree: DNS parsers/bounce taxonomy/complaint rules/metrics/blocklists/alignment/thresholds/change tracking.
8. Workflow Tree: register→verify→ingest→detect→diagnose→remediate→protected change→verify→close.
9. Integration Tree: DNS/ESP/postmaster/feedback/suppression/CRM/analytics/SIEM.
10. Data Tree: sender/DNS/auth/events/reputation/placement/incidents.
11. API Tree: sender health/auth/metrics/incidents/recommendations/evidence.
12. Monetization Tree: domains/senders/volume/accounts/seats/enterprise/API/managed.
13. Distribution Tree: ESP/SaaS/ecommerce/agencies/OEM.
14. Automation Tree: monitoring/diagnosis automatic; DNS/provider/communication changes protected.
15. Moat Tree: cross-provider health history, diagnostics, placement coverage, remediation outcomes.
16. Platform Tree: deliverability monitor→autopilot→sender infrastructure health layer.
17. Risk Tree: facilitating spam/wrong diagnosis/DNS outage/privacy leak/reputation damage.
18. Scale Tree: domain→portfolio→global observatory.
19. Spinoff Tree: DMARC/auth monitor/placement network; domain infrastructure remains adjacent.
20. Command Center Dependencies: domains, communication identity, consent, provider registry, observability, incidents.
21. Design-Now Requirements: each company email identity must map to isolated domain/provider/consent/suppression state.
22. Build-Now Requirements: communication factory must include sender-health/consent hooks, not just send capability.
23. Safe-to-Defer Requirements: customer placement network/ESP connectors/commercial product.
24. Autonomous Mature State: sender health is continuously monitored and technical regressions surfaced/fixed under policy; humans manage strategy, consent and high-impact changes.

## Saturation result
Further branches converge into domain/DNS, consent and communications infrastructure already represented.