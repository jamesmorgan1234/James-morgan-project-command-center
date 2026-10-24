# Company 076 — PII Discovery & Classification API

**Company ID:** `company:future:076`  
**Primary project:** `project:company:future:076`  
**Roadmap version:** `COMPANY-076-v1.0.0`  
**Truth state:** PLANNED  
**Authorization:** roadmap/architecture only; no customer data scanning or classification outside explicitly authorized future environments.

## Business identity
Purpose: discover and classify personal, sensitive, regulated and secret-like information across structured and unstructured enterprise data.

## Product tree
Text Scan API; Database Scanner; File/Object Scanner; Document/PDF Scanner; Spreadsheet Scanner; Log/Ticket Scanner; Source-Code Scanner; Backup Scanner; Image/OCR Scanner; Custom Classifier Builder; Sensitivity Taxonomy; Data Inventory/Catalog; Lineage Hooks; Risk Scoring; Tagging/Labeling; Alerting; Remediation Workflow; Continuous Scan; API/SDK/CLI; Private/Self-Hosted Deployment; Regional/Industry Packs.

## Feature/customer/vertical tree
Features: data source/resource, owner, location/region, data class, detector/version, confidence, exact/approximate location, field/column/path, purpose, retention, policy tags, lineage, access state, risk and remediation evidence.
Customers: enterprises, SaaS, privacy/security/data governance teams, MSPs, AI/data platforms and regulated organizations.
Verticals: consumer apps, healthcare admin, finance-adjacent, HR, education, ecommerce, support, analytics/data platforms and software engineering.

## Brain capability / architecture
Use deterministic patterns/checksums/dictionaries, statistical classifiers and ML/LLM only where ambiguity requires them. Brain may explain classifications but raw sensitive data exposure must be minimized. Architecture: connector sandbox, streaming/chunk scan, detector registry, taxonomy/ontology, confidence calibration, metadata catalog, lineage references, policy engine, redaction preview and evidence.

## Agent tree
Source Discovery Agent; Scanner Agent; Classification Agent; Custom Taxonomy Agent; Confidence/QA Agent; Data Inventory Agent; Risk Agent; Remediation Coordinator; Lineage Agent; Privacy/Security Agent.

## Deterministic services
Regex/checksum/dictionary detectors; schema sampling; entropy/secret-like checks; masking in logs; field/path metadata; dedup; classifier versioning; confidence thresholds; tenant isolation; scanning quotas; retention/deletion of samples.

## Workflow
Register authorized source → classify source/sensitivity boundary → scan minimally → detect candidates → classify/confidence → validate high-impact/ambiguous findings → write metadata/tag, not unnecessary raw copy → map ownership/lineage/policy → alert/remediation plan → rescan/verify closure → preserve evidence.

## Integrations / API / data
Databases, warehouses, object/file stores, docs, SaaS, logs, ticketing, code repos, backups, catalogs, DLP/privacy/GRC. Data retained should favor metadata/fingerprints/findings over raw sensitive payloads.

## Monetization / distribution
GB/objects/rows/scans, connectors, data sources, seats, enterprise/private, API, custom detector packs and managed discovery. Distribution through privacy/security/data ecosystems.

## Security/privacy/compliance
The scanner sees sensitive data, so least privilege, in-region/private options, sample minimization, encryption, no cross-customer model training, redacted findings and strict retention are mandatory. Classification is evidence, not legal determination.

## Failure / edge cases
False positives, encoded data, aliases, free text, OCR errors, encrypted files, compressed archives, huge tables, replicas/backups, derived embeddings, mixed-language text, secrets mistaken for IDs, custom identifiers, stale catalog. Unknown classifications must remain explicit.

## Scale / overlap
API scan → enterprise data inventory → sensitive-data discovery infrastructure. Overlap #47 DSAR, #77 redaction, #78 retention, #94 lineage. #076 owns discovery/classification.

## Classification
**DESIGN NOW:** data sensitivity labels, provenance, retention metadata, region/location, scanner/plugin registry and privacy-preserving evidence.  
**BUILD NOW:** Command Center must classify secrets/private/sensitive project data and prevent cross-project leakage; reverse-map should standardize sensitivity metadata.  
**BUILD BEFORE FIRST COMPANY:** customer connectors, detector engine, catalog and scan sandbox.  
**COMPANY-SPECIFIC LATER:** detector packs/UI/pricing.  
**SCALE-ONLY:** distributed petabyte scanning and privacy-safe aggregate intelligence.

# Mandatory 24-part completion block
1. Product Tree: text/DB/files/docs/spreadsheets/logs/code/backups/images/custom classifiers/taxonomy/catalog/lineage/risk/tags/remediation/API/private.
2. Feature Tree: source/owner/region/class/detector/confidence/location/purpose/retention/policy/lineage/risk/evidence.
3. Customer Tree: enterprise/SaaS/privacy/security/data/MSP/AI/regulated.
4. Vertical Tree: consumer/health admin/finance/HR/education/commerce/support/data/software.
5. Brain Tree: ambiguous classification/explanation; exposure minimized.
6. Agent Tree: source/scan/classify/taxonomy/QA/inventory/risk/remediation/lineage/security.
7. Service Tree: regex/checksum/dictionary/schema/entropy/masking/dedup/version/threshold/quota/retention.
8. Workflow Tree: authorize source→scan→detect→classify→validate→tag→map→remediate→rescan.
9. Integration Tree: DB/warehouse/files/SaaS/logs/tickets/code/backups/catalog/DLP/GRC.
10. Data Tree: source metadata/findings/classes/confidence/tags/owners/lineage/evidence.
11. API Tree: scan/findings/taxonomy/tags/risk/remediation/evidence.
12. Monetization Tree: GB/objects/rows/scans/connectors/sources/seats/enterprise/API/packs.
13. Distribution Tree: privacy/security/data ecosystems/OEM.
14. Automation Tree: discovery/classification/rescan automatic; high-impact remediation separately authorized.
15. Moat Tree: detector coverage, evaluated precision/recall, taxonomy packs, connector breadth.
16. Platform Tree: scan API→data inventory→sensitive-data intelligence layer.
17. Risk Tree: privacy exposure/false classification/raw retention/region violation/missed sensitive data.
18. Scale Tree: API→enterprise→distributed global scans.
19. Spinoff Tree: secret scanner/custom classifier packs; redaction/retention/lineage remain separate.
20. Command Center Dependencies: sensitivity metadata, data catalog, provenance, isolation, policy, retention.
21. Design-Now Requirements: every data/artifact/context record can carry sensitivity/region/retention labels.
22. Build-Now Requirements: standardize Command Center privacy/sensitivity classifications across Brain, Agency, history and artifacts.
23. Safe-to-Defer Requirements: customer connectors/distributed scanners/commercial packs.
24. Autonomous Mature State: authorized sources are continuously classified and drift-scanned; humans resolve ambiguous classifications and approve remediation.

## Saturation result
Further branches converge into redaction, retention, DSAR and lineage products already represented.