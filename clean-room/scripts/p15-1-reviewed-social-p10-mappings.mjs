/**
 * P10 social / communications / publishing rows materialized from the recovered
 * P1-P14 verified package (P10_REPLACEMENT_AUTHORITY_ONLY.md sha256 671b9ed7...,
 * P10_RECONCILIATION_MATRIX.json sha256 db50a526...) against current
 * source-bound implementation and named executable tests.
 *
 * Phase ownership and requirement membership come from the recovered authority,
 * never from the current ledger's empty fields. Every location and test reference
 * below resolves in this repository at the qualified commit.
 */
export function reviewedSocialP10Mappings() {
  const t = (file, name) => `clean-room/tests/${file}.test.mjs :: ${name}`;
  const provenance = 'Recovered P1-P14 verified package P10_REPLACEMENT_AUTHORITY_ONLY.md (sha256 671b9ed799f8da4733cfadd6ec319feee3fa3791c6c53090d2578fccc8c936d8) reconciled by P10_RECONCILIATION_MATRIX.json (sha256 db50a526912c9588203a9a22badd71b3873cc479e8649b9581bd68d3d507abf7); current implementation and test bytes re-bound at the qualified commit.';
  const row = (ids, phase, locations, positive, negative, failure, notes) => ids.map((id) => ({
    id,
    owningPhases: [phase],
    dependencies: ['C0', 'C1', 'C2', 'C3'],
    dependenciesVerified: true,
    applicableCompaniesOrCapabilities: ['Command Center', 'Social Media Center'],
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
      ['CCR-03167', 'CCR-03168', 'CCR-03169', 'CCR-03170', 'CCR-03171', 'CCR-03172', 'CCR-03244', 'CCR-03267', 'CCR-03268', 'CCR-03269', 'CCR-03270', 'CCR-03272', 'CCR-03274', 'CCR-03843', 'CCR-05643', 'CCR-05785'],
      'P10.1',
      ['clean-room/src/social/identity.ts#SocialIdentityMapRegistry', 'clean-room/src/social/identity.ts#BrandAccountRegistry'],
      t('p10-1-social-identity-map', 'P10.1 identity map preserves explicit owner/entity/company/brand/project/account/platform lineage'),
      t('p10-1-social-identity-map', 'P10.1 a platform identity cannot be substituted across canonical brands/accounts'),
      t('p10-1-identity-hardening', 'P10.1 replacement is explicit new identity with retained predecessor, never a silent rebind'),
      'Social identity is an explicit owner-scoped lineage record; cross-brand/account/platform substitution and silent rebinding fail closed. Verified package membership: P10.1.'
    ),
    ...row(
      ['CCR-00799', 'CCR-03174', 'CCR-03175', 'CCR-03176', 'CCR-03177', 'CCR-03178', 'CCR-03179', 'CCR-03180', 'CCR-03181', 'CCR-03182', 'CCR-03183', 'CCR-03184', 'CCR-03185', 'CCR-03186', 'CCR-03187', 'CCR-03188', 'CCR-03189', 'CCR-03190', 'CCR-03193', 'CCR-03194', 'CCR-03195', 'CCR-03249', 'CCR-03250', 'CCR-03251', 'CCR-03252', 'CCR-03426', 'CCR-03627', 'CCR-05167'],
      'P10.2',
      ['clean-room/src/social/connections.ts#connectionIsLive', 'clean-room/src/social/connections.ts#requiredOwnerConnectionAction'],
      t('p10-2-social-connections', 'P10.2 live status requires connected state available provider credential reference token fresh verification and scopes'),
      t('p10-2-social-connections', 'P10.2 token presence alone never means connected live'),
      t('p10-2-social-connections', 'P10.2 disconnected expired revoked states require recoverable reconnect and owner action evidence'),
      'Connection truth is explicit verified state, not token presence; expired/revoked/disconnected paths produce recoverable owner actions. Verified package membership: P10.2.'
    ),
    ...row(
      ['CCR-03204', 'CCR-03213', 'CCR-03214', 'CCR-03218'],
      'P10.3',
      ['clean-room/src/social/drafts.ts#SocialContentAssetRegistry', 'clean-room/src/social/drafts.ts#SocialDraftApprovalBinding'],
      t('p10-3-social-drafts-assets', 'P10.3 publish readiness binds approval to exact revision content and account'),
      t('p10-3-social-drafts-assets', 'P10.3 every source asset requires exact provenance and rights binding'),
      t('p10-3-social-drafts-assets', 'P10.3 account/content revision invalidates prior approval while preserving asset evidence'),
      'Approval binds to an exact revision and account; assets require provenance and rights; drift invalidates approval without erasing evidence. Verified package membership: P10.3.'
    ),
    ...row(
      ['CCR-03205', 'CCR-03206', 'CCR-03207', 'CCR-03208', 'CCR-03209', 'CCR-03210', 'CCR-03211'],
      'P10.4',
      ['clean-room/src/social/profiles.ts#SocialProviderRegistry', 'clean-room/src/social/profiles.ts#PlatformTransformAdapter'],
      t('p10-4-social-platform-profiles', 'P10.4 transforms execute through exact versioned adapter/profile pair'),
      t('p10-4-social-platform-profiles', 'P10.4 profile cannot silently change platform/adapter lineage or use unavailable adapter'),
      t('p10-4-social-platform-profiles', 'P10.4 malformed adapter output fails closed against profile rules'),
      'Platform rules live in versioned profiles and exact adapter pairs; lineage substitution and malformed adapter output fail closed. Verified package membership: P10.4.'
    ),
    ...row(
      ['CCR-03216', 'CCR-03220', 'CCR-03221', 'CCR-03223', 'CCR-03224', 'CCR-03225', 'CCR-03226', 'CCR-03227', 'CCR-03228', 'CCR-03229', 'CCR-03248', 'CCR-03276', 'CCR-03314', 'CCR-03779'],
      'P10.5',
      ['clean-room/src/social/publishing.ts#PublishLedger', 'clean-room/src/social/protected-publishing.ts#SocialPublishGate'],
      t('p10-5-social-publishing', 'P10.5 exact account draft authorization and fresh connection are mandatory'),
      t('p10-5-social-publishing', 'P10.5 lost response becomes uncertain and cannot retry before reconciliation'),
      t('p10-5-social-publishing', 'P10.5 duplicate same receipt is idempotent but conflicting public effect fails closed'),
      'Publishing requires exact account/draft authorization and a fresh connection; uncertain outcomes fence retries and only one public effect is permitted. Verified package membership: P10.5.'
    ),
    ...row(
      ['CCR-03253', 'CCR-03254', 'CCR-03255', 'CCR-03256', 'CCR-03258', 'CCR-03263', 'CCR-03264', 'CCR-03265', 'CCR-03266', 'CCR-03628', 'CCR-03639', 'CCR-03640', 'CCR-03740', 'CCR-03979', 'CCR-04038', 'CCR-04286'],
      'P10.6',
      ['clean-room/src/social/inbox.ts#triageExternalMessage', 'clean-room/src/social/protected-communications.ts#CommunicationSendGate'],
      t('p10-6-social-inbox', 'P10.6 inbound text is always untrusted and cannot authorize actions'),
      t('p10-6-social-inbox', 'P10.6 provider source replay cannot substitute a different message'),
      t('p10-6-social-inbox', 'P10.6 reply drafts remain unauthorized until separate exact authorization is supplied'),
      'External message text is data, never instruction or authority; replay cannot substitute identity and sends require separate exact authorization. Verified package membership: P10.6.'
    ),
    ...row(
      ['CCR-03231', 'CCR-03232', 'CCR-03233', 'CCR-03234', 'CCR-03235', 'CCR-03236', 'CCR-03237', 'CCR-03238', 'CCR-03239', 'CCR-03240', 'CCR-03241', 'CCR-03656'],
      'P10.7',
      ['clean-room/src/social/analytics.ts#MetricAssessment', 'clean-room/src/social/analytics.ts#EvidenceBackedSocialMetric'],
      t('p10-7-social-analytics', 'P10.7 metric evidence preserves identity provenance confidence and freshness policy'),
      t('p10-7-social-analytics', 'P10.7 attribution cannot cross owner brand or account boundaries'),
      t('p10-7-social-analytics', 'P10.7 estimated revenue cannot masquerade as confirmed monetary outcome'),
      'Metric evidence carries identity, provenance, confidence and freshness; estimated outcomes never become confirmed revenue, and attribution cannot cross scope. Verified package membership: P10.7.'
    ),
    ...row(
      ['CCR-03202', 'CCR-03247', 'CCR-03472', 'CCR-03478', 'CCR-05201', 'CCR-05327', 'CCR-05357', 'CCR-05570', 'CCR-05589'],
      'P10.8',
      ['clean-room/src/social/access.ts#SocialAccessBoundary', 'clean-room/src/social/recovery.ts#assertSocialIsolation'],
      t('p10-8-social-recovery-isolation', 'P10.8 social isolation prevents account/platform identity crossing company project or brand boundaries'),
      t('p10-8-social-recovery-isolation', 'P10.8 paid social actions fail closed without exact current bounded owner spend authorization'),
      t('p10-8-social-recovery-isolation', 'P10.8 connection and scope loss produce explicit recoverable actions without authorizing side effects'),
      'Social access is minimal and owner-scoped; isolation, recovery and paid-action gates fail closed rather than inferring authority. Verified package membership: P10.8.'
    )
  ];
}
