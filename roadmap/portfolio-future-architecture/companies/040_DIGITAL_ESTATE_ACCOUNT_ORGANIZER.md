# Company 040 — Digital Estate / Account Organizer

**Company ID:** `company:future:040`  
**Primary project:** `project:company:future:040`  
**Roadmap version:** `COMPANY-040-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no account access, password custody, beneficiary designation, legal document execution or emergency disclosure.

## Business identity

Purpose: help individuals/families securely inventory digital accounts, subscriptions, documents, assets, instructions and trusted contacts so important information is organized for emergencies, incapacity and estate/legacy planning.

Problem: digital lives are fragmented; families do not know what exists, where documents are, what should happen to accounts or which instructions are current.

Value: encrypted inventory, expiry/review reminders, instructions, secure sharing and evidence of ownership/status without becoming a password-stealing vault or legal estate substitute.

## Product tree

Digital Account Inventory; Subscription Inventory; Document Vault/Reference Index; Digital Asset Catalog; Domain/Social/Email Inventory; Cloud/Device/Backup Inventory; Financial-Account Reference Index (no credentials); Instructions/Disposition Notes; Trusted Contact/Emergency Access Plan; Beneficiary/Executor Reference Records; Family/Household Plan; Renewal/Expiration Tracker; Secure Document Sharing; Legacy Checklist; Device/Recovery-Key Reference Map; Deceased/Incapacity Workflow Preparation; Data Export/Portability; Audit/Access History; API/OEM for estate/financial-planning platforms; Professional Advisor Workspace.

## Feature/customer/vertical tree

Features: account/service type, owner, provider, login identifier reference (not secret), recovery method ref, 2FA/device notes, renewal/expiry, billing ref, asset value classification, document location, instruction version/effective date, trusted contact, access condition, legal-document reference, emergency packet, reminders, proof-of-life/review cadence where appropriate, encryption, access logs, export/delete.

Customers: consumers/families, caregivers, executors/personal representatives, financial/estate planning professionals, digital-savvy seniors, small-business owners organizing business/personal digital estates. Enterprise use is limited; this is privacy-first personal/family infrastructure.

Vertical variants: family household, creator/digital asset owner, small-business owner, investor/crypto-reference only with extreme caution, domain/online business owner, professional advisor portal. Do not custody private keys or funds unless separately regulated/authorized.

## Brain capability tree / architecture

Brain helps classify accounts/assets, identify missing categories, draft nonlegal instructions/checklists and detect stale records. It cannot reveal secrets, impersonate users, transfer assets, decide beneficiaries or provide legal advice.

Architecture: zero-knowledge/encrypted vault pattern where feasible, secret-reference rather than password capture, client-side encryption options, relational metadata, object/document encryption, trusted-contact workflow, policy/condition state, immutable access logs, reminders. LLM only on redacted/local metadata or explicitly authorized text.

## Agent tree

Inventory Assistant, Subscription Agent, Document Organizer, Digital Asset Classifier, Expiration/Review Agent, Trusted Contact Coordinator, Emergency Packet Agent, Privacy/Security Agent, Portability/Export Agent, Advisor Collaboration Agent, Staleness/Gaps Agent.

## Deterministic services

Identity/passkey/MFA; encrypted metadata/document store; key-management/recovery interface; reminder scheduler; trusted-contact/access workflow; audit log; export/delete; document hash; emergency packet generator; protected disclosure gate.

## Workflow

Onboard owner → create encrypted inventory → classify accounts/assets/docs → add nonsecret refs/instructions → set review/expiry reminders → configure trusted-contact conditions → periodic review → emergency request enters protected verification/legal/user-presence workflow → disclose only authorized scoped packet → audit → revoke/expire access.

## Integrations / API / data

Password managers only through references/deep links, document storage/export, calendars, domain/subscription providers for read-only inventory where authorized, financial aggregators for account presence only if needed, advisor platforms. Avoid broad browser credential scraping.

Data moat: user-owned structured estate/account schema and privacy/security UX; moat should be trust and portability, not locking in sensitive data.

## Monetization / distribution

Consumer/family subscription, family seats, secure storage tiers, advisor/professional plans, estate-planning/financial-planning OEM, one-time export/archive options. Distribution via privacy/security, financial/estate-planning, family-organizer and domain/creator ecosystems.

## Security/privacy/legal

Extremely sensitive. Passkeys/MFA, encryption, no raw password/private-key storage by default, strict trusted-contact access, legal/identity verification boundaries, no automatic asset transfer, no hidden data sale, transparent portability/deletion, inactivity/death false-positive protection.

## Failure / edge cases

Owner loses devices, trusted contact compromised, family conflict, stale beneficiary info, account already closed, provider changes recovery process, emergency falsely triggered, encryption key lost, legal order conflicts with instructions. Require multi-factor recovery, delay/cooldown for sensitive access, explicit unknowns, advisor/legal escalation.

## Scale/platform/overlap

Individual → family/advisor ecosystem. It should remain privacy-first rather than turning into a surveillance/data marketplace. Overlap #73 secrets rotation only technically; #40 is organization/legacy planning.

## Classification

**DESIGN NOW:** trusted-contact/owner authority, encrypted secret-reference model, privacy/retention/export, conditional access, immutable audit.  
**BUILD NOW:** Command Center owner/trusted-contact/security architecture may reuse lessons after reverse-map, but not build Company 040.  
**BUILD BEFORE FIRST COMPANY:** strong cryptographic/key recovery architecture, privacy threat model, legal/access workflows.  
**COMPANY-SPECIFIC LATER:** consumer vault/app/advisor portal/pricing.  
**SCALE-ONLY:** advisor/OEM ecosystem.

# Mandatory 24-part completion block

1. Product Tree: account/subscription/doc/assets/domain/social/cloud/device/financial refs/instructions/contacts/beneficiary refs/family/expiry/sharing/legacy/device recovery/emergency/export/audit/API/advisor.
2. Feature Tree: owner/provider/identifier ref/recovery/2FA/expiry/billing/value/doc/instruction/trusted contacts/access condition/encryption/log/export.
3. Customer Tree: consumers/families/caregivers/executors/advisors/seniors/small-business/digital asset owners.
4. Vertical Tree: household/creator/small-business/domain/investor-reference/advisor.
5. Brain Tree: organize/gap/staleness/checklist assistance; secret disclosure/legal/asset transfer prohibited.
6. Agent Tree: inventory/subscription/docs/assets/review/contact/emergency/privacy/export/advisor/gaps.
7. Service Tree: identity/MFA/encryption/keys/reminders/trusted access/audit/export/hash/emergency packet/gates.
8. Workflow Tree: onboard→inventory→instructions→reminders→trusted access config→review→protected emergency disclosure→audit/revoke.
9. Integration Tree: password-manager refs/docs/calendar/providers/financial account-presence/advisor systems.
10. Data Tree: account metadata/assets/docs/instructions/contacts/reviews/access events/encrypted packets.
11. API Tree: inventory/export/advisor/authorized access-status, with minimal exposure.
12. Monetization Tree: consumer/family/storage/advisor/OEM/export/archive.
13. Distribution Tree: privacy/security/estate/financial/family/creator/domain ecosystems.
14. Automation Tree: reminders/gap detection/export prep; emergency disclosure and legal actions gated.
15. Moat Tree: privacy trust, secure schema, recovery UX, advisor integrations, portability.
16. Platform Tree: organizer→family digital-estate workspace→advisor/OEM infrastructure.
17. Risk Tree: catastrophic privacy breach, false emergency, account takeover, key loss, family/legal conflict.
18. Scale Tree: individual→family→advisor/OEM; no raw-data network-effect dependence.
19. Spinoff Tree: secure inheritance/credential custody would require separate regulated analysis, not auto-added.
20. Command Center Dependencies: identity/passkeys, trusted-contact concepts, security/policy, encrypted storage refs, audit, portability.
21. Design-Now Requirements: strict secret/reference separation and conditional trusted-access authority.
22. Build-Now Requirements: only reusable owner-security/trusted-contact insights after reverse-map.
23. Safe-to-Defer Requirements: consumer product/storage/advisor integrations/pricing.
24. Autonomous Mature State: inventory/reminders/staleness checks run quietly; emergency access remains tightly verified and human/legal governed.

## Saturation result

Further coherent branches involve regulated custody/estate execution and should be treated as specialist future spinoff research, not silently added to the 100.
