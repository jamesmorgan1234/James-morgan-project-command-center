# 114 — Customer Support Factory

**Status:** DESIGN NOW / BUILD BEFORE FIRST CUSTOMER-FACING COMPANY

## Purpose
Provide reusable support infrastructure while each company retains its own customers, brand, knowledge, communication identities, policies and support records.

## Shared capabilities
Customer/org lookup contract; case/ticket schema; channel adapters; knowledge retrieval; authentication/verification state; issue taxonomy; SLA/priority; conversation history; draft/response workflow; escalation; incident linkage; billing/account lookup through scoped adapters; feedback/CSAT; support QA; support analytics; customer-health signals; self-service portal/KB; status notices; multilingual/accessibility; retention/redaction.

## Isolation
A shared Support Factory never creates one portfolio-wide customer database. Support records are scoped by `company_id + tenant/customer_id`; support Agents/knowledge/search cannot cross companies. Sender domains/mailboxes/phone numbers/brand identity are company-specific.

## AI boundary
AI may classify, summarize, retrieve verified knowledge, draft replies and perform approved low-risk workflows. It cannot invent refunds, promises, contract terms, account changes or security exceptions. Protected account/financial actions use Policy Governor.

## Knowledge contract
Every answer cites/version-binds company-approved KB/product/policy sources. Stale/missing knowledge becomes uncertainty/escalation rather than confident invention.

## Channels
Email, chat, web forms, SMS, voice, social where authorized. Channel provider is replaceable and includes consent/preferences, sender identity, delivery receipt and rate limits.

## Escalation
Human/domain specialist, security, billing, legal/compliance, engineering incident, account owner. Exact reason, context packet, attempted steps and evidence travel with handoff.

## Support QA
Every human/AI interaction may be evaluated against company policy/KB/version. High-impact evaluation findings require calibrated/human review before employment/customer sanctions.

## BUILD NOW
Only the contracts/interfaces that Command Center itself needs for company isolation, communication provider refs, knowledge provenance, Needs Me/escalation and evaluation. No customer-support product or real outreach.

## BUILD BEFORE FIRST COMPANY
Company-specific customer identity, case store, channel bindings, KB, support Agent pack, consent/preference linkage, SLA and escalation routes.

## Acceptance
Two dummy companies can use the same support code while customer records, knowledge, sender identities and actions remain completely separated.