/**
 * P12 specialist rows materialized from the recovered P1-P14 verified package.
 * Phase membership comes verbatim from BULK_AUTHORITY_PARSE.json (sha256 df257f70...)
 * over P12_REPLACEMENT_AUTHORITY_ONLY.md (sha256 a9b29ed6..., authority test report OVERALL PASS).
 * Only rows still UNVERIFIED at materialization time are included.
 */
export function reviewedSpecialistP12Mappings() {
  const t = (file, name) => `clean-room/tests/${file}.test.mjs :: ${name}`;
  const provenance = 'Recovered P1-P14 verified package P12_REPLACEMENT_AUTHORITY_ONLY.md (sha256 a9b29ed654992bcba59b3635320a1d142843376258d8c44535b0bfee252f0d07, authority test report OVERALL PASS) reconciled through BULK_AUTHORITY_PARSE.json (sha256 df257f70305436ca61964c7a4364c8dca519b01962a64632abc7725cdfd292fd); current implementation and test bytes re-bound at the qualified commit.';
  const row = (ids, phase, locations, positive, negative, failure, notes) => ids.map((id) => ({
    id,
    owningPhases: [phase],
    dependencies: ['C0', 'C1', 'C2', 'C3'],
    dependenciesVerified: true,
    applicableCompaniesOrCapabilities: ['Command Center', 'Specialist framework'],
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
      ['CCR-00079', 'CCR-02371', 'CCR-02432', 'CCR-03795', 'CCR-03808', 'CCR-04091'],
      'P12.1',
      ['clean-room/src/specialists/framework.ts#SpecialistFrameworkRegistry', 'clean-room/src/specialists/contracts.ts#validateSpecialistContract'],
      t('p12-1-specialist-framework', 'P12.1 generic specialist framework covers ownership data hooks surfaces metrics providers isolation and canonical authority'),
      t('p12-1-specialist-framework', 'P12.1 missing ownership data/detail/provenance or canonical specialist reference fails closed'),
      t('p12-1-specialist-framework', 'P12.1 framework cannot bind to the wrong PIF.3 identity version or control plane'),
      'The generic specialist framework binds an exact canonical PIF.3 identity/version and fails closed on missing ownership or provenance. Recovered package membership: P12.1.'
    ),
    ...row(
      ['CCR-02031', 'CCR-02658', 'CCR-02665', 'CCR-03281', 'CCR-03310', 'CCR-04193', 'CCR-04194', 'CCR-04195', 'CCR-04196', 'CCR-04197', 'CCR-04198', 'CCR-04199', 'CCR-04200', 'CCR-04201', 'CCR-04202', 'CCR-04203', 'CCR-04204', 'CCR-04494', 'CCR-04543', 'CCR-04544', 'CCR-04545', 'CCR-04546', 'CCR-04547', 'CCR-04548', 'CCR-04549', 'CCR-04550', 'CCR-04826', 'CCR-04852', 'CCR-04853', 'CCR-04854', 'CCR-04858', 'CCR-05517', 'CCR-05518', 'CCR-05640'],
      'P12.2',
      ['clean-room/src/specialists/shopping.ts#ShoppingTripOption', 'clean-room/src/specialists/shopping.ts#ShoppingOfferEvidence'],
      t('p12-2-shopping-specialist', 'P12.2 specialist retains shopping truth ownership while Command Center only orchestrates'),
      t('p12-2-shopping-specialist', 'P12.2 expired offer cannot remain verified'),
      t('p12-2-shopping-specialist', 'P12.2 delayed rebate never reduces out-of-pocket today'),
      'Shopping truth stays specialist-owned; offers expire, rebates do not reduce today cash, and Command Center only orchestrates. Recovered package membership: P12.2.'
    ),
    ...row(
      ['CCR-03655', 'CCR-04551', 'CCR-04552', 'CCR-04553', 'CCR-04555', 'CCR-04825', 'CCR-04861', 'CCR-05519', 'CCR-03799'],
      'P12.3',
      ['clean-room/src/specialists/media.ts#MediaSpecialistProfile', 'clean-room/src/specialists/media.ts#MediaWorkflowRoute'],
      t('p12-3-media-specialist', 'P12.3 media specialist owns research production publishing analytics and revenue routes'),
      t('p12-3-media-specialist', 'P12.3 media source requires rights and provenance'),
      t('p12-3-media-specialist', 'P12.3 autonomous worker boundary blocks portfolio-wide mode'),
      'Media routes and worker boundaries stay specialist-owned; sources require rights/provenance and portfolio-wide autonomy is blocked. Recovered package membership: P12.3.'
    ),
    ...row(
      ['CCR-02948', 'CCR-03757', 'CCR-03797', 'CCR-04037', 'CCR-04564', 'CCR-04864', 'CCR-04865', 'CCR-05520'],
      'P12.4',
      ['clean-room/src/specialists/commerce.ts#CommerceIsolationRegistry', 'clean-room/src/specialists/commerce.ts#validateCommerceEconomics'],
      t('p12-4-commerce-specialist', 'P12.4 commerce truth stays specialist-owned'),
      t('p12-4-commerce-specialist', 'P12.4 product economics rejects negative landed margin'),
      t('p12-4-commerce-specialist', 'P12.4 catalog supplier pricing fulfillment marketing and revenue state cannot cross project boundary'),
      'Commerce truth is specialist-owned and project-isolated; economics reject negative landed margin. Recovered package membership: P12.4.'
    ),
    ...row(
      ['CCR-03802'],
      'P12.5',
      ['clean-room/src/specialists/digital-products.ts#DigitalProductVentureRegistry'],
      t('p12-5-digital-products-specialist', 'P12.5 digital-product specialist owns venture truth'),
      t('p12-5-digital-products-specialist', 'P12.5 storefronts remain isolated across ventures'),
      t('p12-5-digital-products-specialist', 'P12.5 product files delivery pricing and state remain exact venture scoped'),
      'Digital-product venture truth is specialist-owned; storefronts and delivery stay venture-scoped. Recovered package membership: P12.5.'
    ),
    ...row(
      ['CCR-03800'],
      'P12.6',
      ['clean-room/src/specialists/service-business.ts#ServiceBusinessRegistry'],
      t('p12-6-service-business-specialist', 'P12.6 service-business specialist owns service-business truth'),
      t('p12-6-service-business-specialist', 'P12.6 CRM ownership remains isolated across service-business projects'),
      t('p12-6-service-business-specialist', 'P12.6 lead-to-job state and linked records stay company/project scoped'),
      'Service-business truth is specialist-owned with CRM and lead-to-job state scoped to company/project. Recovered package membership: P12.6.'
    ),
    ...row(
      ['CCR-02951', 'CCR-03796', 'CCR-03801'],
      'P12.7',
      ['clean-room/src/specialists/software-platform.ts#SoftwarePlatformRegistry'],
      t('p12-7-software-platform-specialist', 'P12.7 software-platform specialist owns software-platform truth'),
      t('p12-7-software-platform-specialist', 'P12.7 repository ownership remains isolated across software-platform projects'),
      t('p12-7-software-platform', 'P12.7 deployment evidence binds exact repository provider commit and environment'),
      'Software-platform truth and repository ownership are specialist-owned and project-isolated; deployment evidence binds the exact commit/environment. Recovered package membership: P12.7.'
    ),
    ...row(
      ['CCR-04420', 'CCR-04444', 'CCR-05162', 'CCR-05163', 'CCR-05164', 'CCR-05179', 'CCR-05479', 'CCR-05480', 'CCR-05481'],
      'P12.8',
      ['clean-room/src/specialists/isolation.ts#assertSpecialistIsolation', 'clean-room/src/specialists/registry.ts#SpecialistRegistry', 'clean-room/src/specialists/lifecycle.ts'],
      t('p12-8-specialist-lifecycle-isolation', 'P12.8 future specialist types register without changing Command Center truth ownership'),
      t('p12-8-specialist-lifecycle-isolation', 'P12.8 canonical specialist truth cannot collide across projects'),
      t('p12-8-specialist-lifecycle-isolation', 'P12.8 lifecycle mutations require exact action authorization and provider reactivation readiness'),
      'Specialist lifecycle and isolation keep canonical truth non-colliding, require exact authorization and isolate provider loss. Recovered package membership: P12.8.'
    )
  ];
}
