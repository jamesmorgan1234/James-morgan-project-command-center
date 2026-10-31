/**
 * P11 books rows materialized from the recovered P1-P14 verified package.
 * Phase membership comes verbatim from clean-room/evidence/P15_1_RECOVERED_P11_PHASE_MAP.json,
 * itself recovered from BULK_AUTHORITY_PARSE.json (sha256 df257f70...) over
 * P11_REPLACEMENT_AUTHORITY_ONLY.md (sha256 426f3159..., authority test report OVERALL PASS).
 *
 * Only rows still UNVERIFIED at materialization time are included; rows already
 * proven by other reviewed modules are left untouched. Every location and test
 * reference below resolves in this repository.
 */
export function reviewedSocialP11BooksMappings() {
  const t = (file, name) => `clean-room/tests/${file}.test.mjs :: ${name}`;
  const provenance = 'Recovered P1-P14 verified package P11_REPLACEMENT_AUTHORITY_ONLY.md (sha256 426f3159ac5b9256cc007ba5ff96cf398eb8c331abba214c9205c8180155a4c2, authority test report OVERALL PASS) reconciled through BULK_AUTHORITY_PARSE.json (sha256 df257f70305436ca61964c7a4364c8dca519b01962a64632abc7725cdfd292fd) into P15_1_RECOVERED_P11_PHASE_MAP.json; current implementation and test bytes re-bound at the qualified commit.';
  const row = (ids, phase, locations, positive, negative, failure, notes) => ids.map((id) => ({
    id,
    owningPhases: [phase],
    dependencies: ['C0', 'C1', 'C2', 'C3'],
    dependenciesVerified: true,
    applicableCompaniesOrCapabilities: ['Command Center', 'Books / Publishing'],
    implementationLocations: locations,
    tests: {
      positive: { applicable: true, references: [positive], justification: null },
      negative: { applicable: true, references: [negative], justification: null },
      failurePath: { applicable: true, references: [failure], justification: null }
    },
    evidence: [provenance],
    closureNotes: notes
  }));

  return [
    ...row(
      ['CCR-00081', 'CCR-00270', 'CCR-00503', 'CCR-02033', 'CCR-02475', 'CCR-02790', 'CCR-02849', 'CCR-02850', 'CCR-02852', 'CCR-02853', 'CCR-02869', 'CCR-02870', 'CCR-02890', 'CCR-04009', 'CCR-04557', 'CCR-04558', 'CCR-04827', 'CCR-04828'],
      'P11.1',
      ['clean-room/src/books/registry.ts#BookRegistry', 'clean-room/src/books/registry.ts#BookRecord'],
      t('p11-1-books-registry', 'P11.1 registry preserves author project hierarchy title order and formats'),
      t('p11-1-books-registry', 'P11.1 hierarchy rejects invalid parent roles duplicate ordering and trilogy overflow'),
      t('p11-1-books-registry', 'P11.1 canonical book lineage cannot silently substitute owner project author type hierarchy or role'),
      'Book registry owns author/project/hierarchy/format identity; invalid hierarchy and lineage substitution fail closed. Recovered package membership: P11.1.'
    ),
    ...row(
      ['CCR-00246', 'CCR-01073', 'CCR-02133', 'CCR-02474', 'CCR-02476', 'CCR-02855', 'CCR-02856', 'CCR-02868', 'CCR-04560'],
      'P11.2',
      ['clean-room/src/books/assets.ts#BookAssetLedger'],
      t('p11-2-book-assets', 'P11.2 authoritative protected asset is explainable by exact file hash provenance and approval'),
      t('p11-2-book-assets', 'P11.2 protected approved assets cannot be silently replaced'),
      t('p11-2-book-assets', 'P11.2 reconstruction status is explicit and cannot masquerade as original'),
      'Protected assets bind exact hash, provenance and approval; silent replacement and reconstruction masquerade fail closed. Recovered package membership: P11.2.'
    ),
    ...row(
      ['CCR-00517', 'CCR-00521', 'CCR-00860', 'CCR-01487', 'CCR-01824', 'CCR-01916', 'CCR-01917', 'CCR-02866', 'CCR-02877', 'CCR-02878', 'CCR-02879', 'CCR-02880', 'CCR-02881', 'CCR-03516', 'CCR-03815', 'CCR-03816', 'CCR-03817', 'CCR-03818', 'CCR-03822', 'CCR-03823', 'CCR-03834'],
      'P11.3',
      ['clean-room/src/books/qa.ts#evaluateBookQa'],
      t('p11-3-book-qa', 'P11.3 fiction QA requires editing continuity originality interior and format before advance'),
      t('p11-3-book-qa', 'P11.3 failed required evidence blocks advancement even when all gates have evidence'),
      t('p11-3-book-qa', 'P11.3 visual subtypes require image QA and fail closed when image evidence is missing'),
      'Production QA gates require exact evidence per subtype and block advancement when required evidence is missing or failed. Recovered package membership: P11.3.'
    ),
    ...row(
      ['CCR-01601', 'CCR-02135', 'CCR-02478', 'CCR-02479', 'CCR-02481', 'CCR-02857', 'CCR-02858', 'CCR-02859', 'CCR-02861', 'CCR-02862', 'CCR-02863', 'CCR-02864', 'CCR-02865', 'CCR-03212'],
      'P11.4',
      ['clean-room/src/books/metadata.ts#validateMetadata', 'clean-room/src/books/metadata.ts#validateRollout', 'clean-room/src/books/publication-metadata.ts#validateBookPublicationMetadata'],
      t('p11-4-book-publication-metadata-details', 'P11.4 publication metadata carries title subtitle edition author ISBN print specs package and exact file mappings'),
      t('p11-4-book-metadata-rollout', 'P11.4 rollout order is contiguous owner-locked and KDP Select only applies to Kindle'),
      t('p11-4-book-publication-metadata-details', 'P11.4 every declared format requires exactly one canonical file mapping'),
      'Metadata, formats, pricing and rollout are versioned and owner-locked; every declared format requires one canonical mapping. Recovered package membership: P11.4.'
    ),
    ...row(
      ['CCR-00519', 'CCR-00520', 'CCR-01837', 'CCR-02470', 'CCR-02472', 'CCR-02473', 'CCR-02854', 'CCR-02867', 'CCR-02882', 'CCR-02883', 'CCR-02884', 'CCR-03197', 'CCR-04831', 'CCR-04972', 'CCR-05236', 'CCR-05590', 'CCR-05700'],
      'P11.5',
      ['clean-room/src/books/approvals.ts#BookApprovalLedger', 'clean-room/src/books/approval-state.ts#ProtectedBookApprovalStateLedger'],
      t('p11-5-book-approvals', 'P11.5 approved state requires explicit owner action and exact target identity'),
      t('p11-5-book-approvals', 'P11.5 discussion alone cannot alter locked book assets'),
      t('p11-5-book-approval-state-machine', 'P11.5 locked target cannot silently change identity or version'),
      'Approval and protected-change state require explicit owner action over exact target identity; discussion cannot mutate locked state. Recovered package membership: P11.5.'
    ),
    ...row(
      ['CCR-02125', 'CCR-02185', 'CCR-02477', 'CCR-02480', 'CCR-02482', 'CCR-02483', 'CCR-02484', 'CCR-02485', 'CCR-02486', 'CCR-02860', 'CCR-02871', 'CCR-02872', 'CCR-02873', 'CCR-02874', 'CCR-02885', 'CCR-02886', 'CCR-02887', 'CCR-03217', 'CCR-03222', 'CCR-04497', 'CCR-04559', 'CCR-04829', 'CCR-05521', 'CCR-05592', 'CCR-05650'],
      'P11.6',
      ['clean-room/src/books/publication.ts#validatePublication', 'clean-room/src/books/publication-lifecycle.ts#BookPublicationLifecycleLedger'],
      t('p11-6-book-publication-lifecycle', 'P11.6 live requires exact provider listing receipt publication ref timestamp and evidence'),
      t('p11-6-book-publication', 'P11.6 invalid jumps and provider publication substitution fail closed'),
      t('p11-6-book-publication', 'P11.6 blocked publication requires explicit reason or error evidence'),
      'Publication lifecycle advances only through allowed evidence-backed states; live requires provider receipt identity and blocked states require explicit reason. Recovered package membership: P11.6.'
    ),
    ...row(
      ['CCR-00798', 'CCR-03173', 'CCR-03827', 'CCR-03828', 'CCR-05173'],
      'P11.7',
      ['clean-room/src/books/providers.ts#PublishingProviderRegistry', 'clean-room/src/books/provider-connection.ts#validatePublishingProviderConnection'],
      t('p11-7-book-provider-connections', 'P11.7 connected providers require credential references and expose format/capability contracts'),
      t('p11-7-book-providers', 'P11.7 account/browser boundaries are truthful and cannot be disguised as normal chat'),
      t('p11-7-book-provider-connections', 'P11.7 provider replacement requires migration lineage'),
      'Publishing providers are versioned adapters with explicit capability/boundary contracts; connections require credential references and replacement requires lineage. Recovered package membership: P11.7.'
    ),
    ...row(
      ['CCR-02471', 'CCR-02950', 'CCR-03943'],
      'P11.8',
      ['clean-room/src/books/performance.ts#reconcileBookMetrics', 'clean-room/src/books/performance-truth.ts#validateBookPerformanceRecord'],
      t('p11-8-book-performance-truth', 'P11.8 unknown remains unknown and verified zero remains zero'),
      t('p11-8-book-performance', 'P11.8 conflicting duplicate metric ids fail closed instead of double counting'),
      t('p11-8-book-performance', 'P11.8 settled royalties require settlement evidence and currency'),
      'Performance truth separates projected/confirmed/settled, preserves unknown versus zero and refuses double counting. Recovered package membership: P11.8.'
    ),
    ...row(
      ['CCR-00500', 'CCR-00790', 'CCR-01915', 'CCR-02206', 'CCR-02207', 'CCR-02208', 'CCR-02209', 'CCR-02210', 'CCR-02211', 'CCR-02212', 'CCR-02213', 'CCR-02214', 'CCR-02215', 'CCR-02219', 'CCR-02220', 'CCR-02221', 'CCR-02222', 'CCR-02223', 'CCR-02224', 'CCR-02225', 'CCR-02226', 'CCR-02227', 'CCR-02228', 'CCR-02351', 'CCR-02364', 'CCR-02493', 'CCR-02613', 'CCR-02618', 'CCR-02712', 'CCR-02848', 'CCR-02851', 'CCR-02888', 'CCR-02889', 'CCR-03067', 'CCR-03275', 'CCR-03315', 'CCR-03322', 'CCR-03368', 'CCR-03369', 'CCR-03370', 'CCR-03371', 'CCR-03372', 'CCR-03373', 'CCR-03374', 'CCR-03376', 'CCR-03756', 'CCR-03758', 'CCR-03798', 'CCR-03872', 'CCR-04036', 'CCR-04241', 'CCR-04291', 'CCR-04554', 'CCR-04556', 'CCR-04561', 'CCR-04581', 'CCR-04862', 'CCR-05482', 'CCR-05522', 'CCR-05587'],
      'P11.9',
      ['clean-room/src/books/boundaries.ts#assertBookExecutionAllowed'],
      t('p11-9-book-execution-boundaries', 'P11.9 normal chat owns planning/research/writing/QC/package work and Work stays publishing-only'),
      t('p11-9-book-execution-boundaries', 'P11.9 portfolio Agent Auto remains excluded'),
      t('p11-9-book-execution-boundaries', 'P11.9 execution policy cannot cross owner/project scope'),
      'Book execution boundaries keep planning/research/writing/QC in normal chat, Work publishing-only, and exclude portfolio Agent Auto. Recovered package membership: P11.9.'
    ),
    ...row(
      ['CCR-00042', 'CCR-00273', 'CCR-00319', 'CCR-00585', 'CCR-00619', 'CCR-00621', 'CCR-00623', 'CCR-00625', 'CCR-00716', 'CCR-00720', 'CCR-00723', 'CCR-00742', 'CCR-00747', 'CCR-00763', 'CCR-00830', 'CCR-01080', 'CCR-01184', 'CCR-01489', 'CCR-01561', 'CCR-01562', 'CCR-01635', 'CCR-01636', 'CCR-01637', 'CCR-01638', 'CCR-01639', 'CCR-01640', 'CCR-01641', 'CCR-01642', 'CCR-01643', 'CCR-01644', 'CCR-01645', 'CCR-01646', 'CCR-01647', 'CCR-01648', 'CCR-01649', 'CCR-01650', 'CCR-01651', 'CCR-01652', 'CCR-01653', 'CCR-01654', 'CCR-01655', 'CCR-01703', 'CCR-01717', 'CCR-01808', 'CCR-01827', 'CCR-01840', 'CCR-01848', 'CCR-01867', 'CCR-01868', 'CCR-01869', 'CCR-01870', 'CCR-01884', 'CCR-01913', 'CCR-01914', 'CCR-01952', 'CCR-01967', 'CCR-01976', 'CCR-01977', 'CCR-01978', 'CCR-01979', 'CCR-01980', 'CCR-01982', 'CCR-02132', 'CCR-02145', 'CCR-02217', 'CCR-02253', 'CCR-02632', 'CCR-02875', 'CCR-02876', 'CCR-02891', 'CCR-02892', 'CCR-03018', 'CCR-03157', 'CCR-03165', 'CCR-03375', 'CCR-03447', 'CCR-03448', 'CCR-03449', 'CCR-03450', 'CCR-03451', 'CCR-03452', 'CCR-03453', 'CCR-03454', 'CCR-03455', 'CCR-03456', 'CCR-03457', 'CCR-03458', 'CCR-03459', 'CCR-03460', 'CCR-03461', 'CCR-03462', 'CCR-03463', 'CCR-03464', 'CCR-03465', 'CCR-03466', 'CCR-04077', 'CCR-04078', 'CCR-04963', 'CCR-04964', 'CCR-05087', 'CCR-05097', 'CCR-05136', 'CCR-05213', 'CCR-05214', 'CCR-05215', 'CCR-05216', 'CCR-05217', 'CCR-05218', 'CCR-05219', 'CCR-05220', 'CCR-05374', 'CCR-05537', 'CCR-05607', 'CCR-05664', 'CCR-05669', 'CCR-05707', 'CCR-05749'],
      'P11.10',
      ['clean-room/src/books/recovery.ts#validateBookRecovery', 'clean-room/src/books/recovery-restore.ts#validateBookRestoreManifest', 'clean-room/src/books/recovery-restore.ts#assertRestoreDoesNotResurrectAuthority'],
      t('p11-10-book-restore-integrity', 'P11.10 restore preserves compatibility provenance approvals publication and protected assets'),
      t('p11-10-book-restore-integrity', 'P11.10 incompatible restores and unresolved conflicts fail closed'),
      t('p11-10-book-restore-integrity', 'P11.10 superseded state and revoked authority cannot be resurrected'),
      'Recovery, archive, export and restore preserve provenance; incompatible restores fail closed and revoked authority cannot be resurrected. Recovered package membership: P11.10.'
    )
  ];
}
