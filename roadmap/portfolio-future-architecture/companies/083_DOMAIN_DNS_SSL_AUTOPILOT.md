# Company 083 — Domain / DNS / SSL Autopilot

**Company ID:** `company:future:083`  
**Primary project:** `project:company:future:083`  
**Roadmap version:** `COMPANY-083-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no registrar, DNS, certificate, mail-authentication or domain ownership changes.

## Business identity
Purpose: prevent internet-infrastructure failures and hijacks by continuously monitoring domains, DNS, TLS certificates, nameservers, DNSSEC and mail-related DNS configuration.

## Product tree
Domain Inventory; Registrar/Renewal Monitor; Ownership/Lock Monitor; DNS Zone Monitor; Record Drift; DNSSEC Monitor; Nameserver Health; TLS/Certificate Monitor; CAA; Redirect/HTTP Endpoint Check; Subdomain Inventory; MX/SPF/DKIM/DMARC Health; Propagation/Change Verification; Hijack/Tamper Detection; Expiration Alerts; Change Planner; Approved Auto-Remediation; Evidence/History; API/SDK; MSP/Multi-Tenant; Enterprise/Private Deployment.

## Feature/customer/vertical tree
Features: domain/zone/provider/account refs, registrar, expiry/auto-renew state, lock status, nameservers, DNS records/TTL, DNSSEC, cert issuer/SAN/expiry/chain, CAA, mail records, HTTP/TLS health, change history, expected configuration, drift, risk and verification.
Customers: SMBs, SaaS, enterprises, agencies, MSPs, ecommerce, IT/security teams, multi-brand companies and domain portfolio owners.
Verticals: websites/apps, ecommerce, email-heavy businesses, APIs, multi-tenant SaaS, brands/franchises and regulated/public systems.

## Brain capability / architecture
Brain may explain anomalies and recommend corrections; deterministic DNS/TLS parsers/resolvers and expected-state policies own detection. Changes require protected authority because a single wrong record can cause outage/hijack.

Architecture: domain/provider registry, authoritative/public resolver probes, DNS canonical model, certificate scanner, registrar adapters, expected-state/version store, mail-auth parser, propagation verifier, incident state machine and protected change/rollback.

## Agent tree
Domain Inventory Agent; DNS Health Agent; Certificate Agent; DNSSEC Agent; Mail DNS Agent; Drift Agent; Hijack Risk Agent; Propagation Verifier; Change Planner; Incident Agent; QA/Security Agent.

## Deterministic services
DNS resolution; record normalization; TTL/version diff; cert chain validation; expiry timers; DNSSEC checks; SPF/DKIM/DMARC syntax; CAA checks; endpoint probes; provider locks; change idempotency; rollback snapshots.

## Workflow
Inventory → capture expected known-good state → continuously resolve/probe → detect expiry/drift/tamper → classify impact → alert/plan → protected provider change if authorized → verify propagation from independent resolvers → check TLS/app/mail health → rollback/escalate on failure → preserve evidence.

## Integrations / API / data
Registrars, DNS providers, certificate authorities/ACME, CDN/hosting, email providers, monitoring/SIEM. Data: domains, records, cert metadata, provider refs, expected versions, observations, incidents and changes; credentials remain secret refs.

## Monetization / distribution
Domains/zones/certificates, probes, seats, MSP tenants, enterprise/private, API and managed infrastructure monitoring. Distribution through hosting/domain/MSP/security ecosystems.

## Security/privacy/compliance
Registrar/DNS credentials are critical; use least privilege, domain locks, step-up, out-of-band verification, immutable change evidence, no automatic ownership transfer. Avoid exposing internal/private zone data to unauthorized probes.

## Failure / edge cases
Registrar API outage, stale resolver cache, split-horizon DNS, DNSSEC rollover, wildcard cert, ACME failure, certificate chain issue, nameserver migration, propagation variance, deliberate temporary record, expired payment method, subdomain takeover, dangling CNAME, mail-provider migration.

## Scale / overlap
Single domain → multi-brand portfolio → internet-infrastructure control plane. Overlap #84 deliverability, #49 reliability, #73 credential rotation. #083 owns domains/DNS/TLS state.

## Classification
**DESIGN NOW:** provider/account registry, expiring-resource scheduler, expected-state drift, protected infrastructure changes, independent verification and rollback.  
**BUILD NOW:** Command Center future company factory will own many domains; portfolio registry must support domain/environment/provider refs without mixing companies.  
**BUILD BEFORE FIRST COMPANY:** domain registry/monitoring/credential isolation before any portfolio company launches publicly.  
**COMPANY-SPECIFIC LATER:** commercial customer monitoring/remediation product.  
**SCALE-ONLY:** massive global probe network.

# Mandatory 24-part completion block
1. Product Tree: domain/registrar/DNS/drift/DNSSEC/nameserver/TLS/CAA/redirect/subdomain/mail DNS/propagation/hijack/alerts/remediation/API.
2. Feature Tree: domain/provider/account/expiry/lock/nameservers/records/TTL/DNSSEC/cert/CAA/mail/health/history/risk.
3. Customer Tree: SMB/SaaS/enterprise/agency/MSP/ecommerce/IT/security/brand portfolios.
4. Vertical Tree: sites/apps/commerce/email/API/SaaS/franchise/public systems.
5. Brain Tree: explain/recommend; DNS/TLS truth deterministic.
6. Agent Tree: inventory/DNS/cert/DNSSEC/mail/drift/hijack/propagation/change/incident/QA.
7. Service Tree: resolution/normalize/diff/cert validate/timers/DNSSEC/mail syntax/CAA/probes/idempotency/rollback.
8. Workflow Tree: inventory→expected state→probe→detect→plan→authorize change→verify propagation/health→rollback/evidence.
9. Integration Tree: registrar/DNS/CA/CDN/hosting/email/SIEM.
10. Data Tree: domains/records/certs/provider refs/versions/observations/incidents/changes.
11. API Tree: domains/zones/observations/alerts/changes/verify/evidence.
12. Monetization Tree: domains/zones/certs/probes/seats/MSP/enterprise/API/managed.
13. Distribution Tree: hosting/domain/MSP/security/OEM.
14. Automation Tree: monitoring/expiry/verification automatic; DNS/registrar changes protected.
15. Moat Tree: provider adapters, drift history, global probe coverage, recovery outcomes.
16. Platform Tree: monitor→domain ops autopilot→internet identity infrastructure.
17. Risk Tree: outage/hijack/wrong DNS/cert failure/credential compromise/false drift.
18. Scale Tree: domain→portfolio→global probe fabric.
19. Spinoff Tree: subdomain takeover/cert management modules; deliverability remains separate.
20. Command Center Dependencies: portfolio registry, provider/secret refs, scheduler, protected changes, observability, incidents.
21. Design-Now Requirements: each company gets isolated domain/provider/environment metadata in portfolio registry.
22. Build-Now Requirements: add domain/DNS/certificate resource types and expiring-resource hooks to company factory architecture.
23. Safe-to-Defer Requirements: customer monitoring/global probes/commercial remediation.
24. Autonomous Mature State: infrastructure drift/expiry is continuously verified; humans approve ownership/high-risk DNS changes and incident recovery.

## Saturation result
Further branches converge into email deliverability, reliability and credential rotation already represented.