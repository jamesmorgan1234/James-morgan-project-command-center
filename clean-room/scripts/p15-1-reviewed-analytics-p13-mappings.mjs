/**
 * P13 analytics / observability rows materialized from the recovered P1-P14 verified package.
 * Phase ownership comes verbatim from evidence/P15_1_RECOVERED_P13_PHASE_MAP.json (409 ids,
 * exactly equal to the canonical analytics owner cluster).
 */
export function reviewedAnalyticsP13Mappings() {
  const t = (file, name) => `clean-room/tests/${file}.test.mjs :: ${name}`;
  const provenance = 'Recovered P1-P14 verified package P13_REPLACEMENT_AUTHORITY_ONLY.md (sha256 a7ccf539cbbfc9a0cf103d6c2371b370ee1d7eb0892ff1530796f53ac05c62ee, authority test report 009d740f... OVERALL PASS) reconciled through BULK_AUTHORITY_PARSE.json (sha256 df257f70...); membership equals the canonical analytics owner cluster exactly.';
  const locations = ["clean-room/src/analytics/measurement-schema.ts#ANALYTICS_EVENT_NAMES","clean-room/src/analytics/observability.ts#TraceLedger","clean-room/src/analytics/privacy-instrumentation.ts#sanitizeAnalyticsProperties","clean-room/src/analytics/operating-readiness.ts#ROLLOUT_LADDER","clean-room/src/analytics/evaluators.ts#validateEvaluator","clean-room/src/analytics/self-audit.ts#selfAudit"];
  const row = (ids, phase, positive, negative, failure, notes) => ids.map((id) => ({
    id, owningPhases: [phase], dependencies: ['C0','C1','C2','C3'], dependenciesVerified: true,
    applicableCompaniesOrCapabilities: ['Command Center','Analytics / Observability'],
    implementationLocations: locations,
    tests: {
      positive: { applicable: true, references: [positive], justification: null },
      negative: { applicable: true, references: [negative], justification: null },
      failurePath: { applicable: true, references: [failure], justification: null }
    },
    evidence: [provenance], closureNotes: notes
  }));
  return [
    ...row(["CCR-00088","CCR-00247","CCR-00804","CCR-01260","CCR-01677","CCR-02047","CCR-02506","CCR-02508","CCR-02511","CCR-02512","CCR-02514","CCR-02941","CCR-02943","CCR-02944","CCR-02945","CCR-02946","CCR-02953","CCR-02954","CCR-02955","CCR-02956","CCR-02957","CCR-02958","CCR-02959","CCR-02962","CCR-03686","CCR-03966","CCR-04093","CCR-04905","CCR-04906","CCR-04928","CCR-04936","CCR-05176","CCR-05646"],
      'P13.1',
      t('category13-measurement-schema','P13.1 defines a complete event and KPI dictionary for every mandatory core journey'),
      t('category13-privacy-instrumentation','P13.2 rejects sensitive payload keys and secret-like values'),
      t('category13-authoritative-acceptance','P13.1 cognitive/ecosystem health keeps missing data unknown and provenance/uncertainty explicit'),
      'Recovered package membership P13.1; analytics measurement, observability, privacy, readiness and evaluator proof re-bound at the qualified commit.'),
    ...row(["CCR-00474","CCR-00772","CCR-00872","CCR-00931","CCR-01102","CCR-01125","CCR-01280","CCR-01377","CCR-01522","CCR-01604","CCR-01806","CCR-01810","CCR-01815","CCR-01817","CCR-01882","CCR-01898","CCR-02102","CCR-02626","CCR-03033","CCR-03354","CCR-03364","CCR-03366","CCR-04531","CCR-04683","CCR-05129","CCR-05239","CCR-05259","CCR-05311","CCR-05336","CCR-05360","CCR-05365","CCR-05614","CCR-05629","CCR-05743","CCR-05789","CCR-05823"],
      'P13.2',
      t('category13-privacy-instrumentation','P13.2 product analytics requires affirmative telemetry consent'),
      t('category13-privacy-instrumentation','P13.2 rejects sensitive payload keys and secret-like values'),
      t('category13-authoritative-acceptance','P13.2 explainability covers intent through learning without secret leakage'),
      'Recovered package membership P13.2; analytics measurement, observability, privacy, readiness and evaluator proof re-bound at the qualified commit.'),
    ...row(["CCR-00398","CCR-00476","CCR-00594","CCR-00595","CCR-01370","CCR-01394","CCR-01472","CCR-01671","CCR-01672","CCR-01673","CCR-01686","CCR-01688","CCR-01692","CCR-01809","CCR-01986","CCR-01989","CCR-01990","CCR-01991","CCR-01992","CCR-01993","CCR-01995","CCR-02049","CCR-02249","CCR-02397","CCR-03004","CCR-03005","CCR-03011","CCR-03014","CCR-03015","CCR-03016","CCR-03017","CCR-03191","CCR-03685","CCR-04509","CCR-04920","CCR-04921","CCR-05286","CCR-05347","CCR-05348","CCR-05366","CCR-05367","CCR-05368","CCR-05371","CCR-05385","CCR-05620","CCR-05708","CCR-05709","CCR-05710","CCR-05712","CCR-05714","CCR-05715","CCR-05716","CCR-05719","CCR-05720","CCR-05795"],
      'P13.3',
      t('category13-authoritative-acceptance','P13.3 drift pressure distinguishes actual failure domains and revalidation'),
      t('category13-operating-readiness','P13.3 core journey instrumentation emits measurable starts and outcomes for every required journey'),
      t('category13-operating-readiness','P13.3 core journey instrumentation emits measurable starts and outcomes for every required journey'),
      'Recovered package membership P13.3; analytics measurement, observability, privacy, readiness and evaluator proof re-bound at the qualified commit.'),
    ...row(["CCR-02942"],
      'P13.4',
      t('category13-operating-readiness','P13.4 operating dashboard exposes the required release/support failure modes'),
      t('category13-operating-readiness','P13.4 operating dashboard exposes the required release/support failure modes'),
      t('category13-operating-readiness','P13.4 operating dashboard exposes the required release/support failure modes'),
      'Recovered package membership P13.4; analytics measurement, observability, privacy, readiness and evaluator proof re-bound at the qualified commit.'),
    ...row(["CCR-05369"],
      'P13.5',
      t('category13-operating-readiness','P13.5 rollout ladder has six ordered stages and production stages require explicit authorization'),
      t('category13-operating-readiness','P13.5 rollout ladder has six ordered stages and production stages require explicit authorization'),
      t('category13-operating-readiness','P13.5 rollout ladder has six ordered stages and production stages require explicit authorization'),
      'Recovered package membership P13.5; analytics measurement, observability, privacy, readiness and evaluator proof re-bound at the qualified commit.'),
    ...row(["CCR-00338","CCR-00342","CCR-00344","CCR-00752","CCR-00769","CCR-00839","CCR-01099","CCR-01273","CCR-01314","CCR-01315","CCR-01316","CCR-01317","CCR-01318","CCR-01319","CCR-01320","CCR-01321","CCR-01322","CCR-01324","CCR-01327","CCR-01328","CCR-01329","CCR-01330","CCR-01333","CCR-01334","CCR-02150","CCR-02561","CCR-02564","CCR-02565","CCR-02566","CCR-03378","CCR-03379","CCR-03380","CCR-03381","CCR-03382","CCR-03383","CCR-03396","CCR-04163","CCR-04267","CCR-04346","CCR-04348","CCR-04349","CCR-04355","CCR-04357","CCR-04358","CCR-04359","CCR-04360","CCR-04361","CCR-04364","CCR-04365","CCR-04366","CCR-04367","CCR-04368","CCR-04369","CCR-04370","CCR-04371","CCR-04375","CCR-04376","CCR-04378","CCR-04379","CCR-04458","CCR-04596","CCR-04941","CCR-05467","CCR-05805"],
      'P13.6',
      t('category13-durable-governance-evidence','P13.6 separates predicted actual process decision and transfer outcomes'),
      t('category13-operating-readiness','P13.6 kill switches fail closed for required capabilities and rollback playbooks are defined'),
      t('category13-operating-readiness','P13.6 kill switches fail closed for required capabilities and rollback playbooks are defined'),
      'Recovered package membership P13.6; analytics measurement, observability, privacy, readiness and evaluator proof re-bound at the qualified commit.'),
    ...row(["CCR-00604"],
      'P13.7',
      t('category13-operating-readiness','P13.7 launch rehearsal catalog covers all eight required incidents and validates evidence'),
      t('category13-durable-governance-evidence','P13.7 learning evidence keeps local scope and explicit promotion state'),
      t('category13-durable-governance-evidence','P13.7 learning evidence keeps local scope and explicit promotion state'),
      'Recovered package membership P13.7; analytics measurement, observability, privacy, readiness and evaluator proof re-bound at the qualified commit.'),
    ...row(["CCR-05353","CCR-05724","CCR-05725","CCR-05727","CCR-05730","CCR-05731","CCR-05733","CCR-05734","CCR-05744","CCR-05745","CCR-05747","CCR-05762"],
      'P13.8',
      t('category13-authoritative-acceptance','P13.8 correlated observations are not counted as independent consensus'),
      t('category13-durable-governance-evidence','P13.8 correlated error dimensions are explicit'),
      t('category13-durable-governance-evidence','P13.8 correlated error dimensions are explicit'),
      'Recovered package membership P13.8; analytics measurement, observability, privacy, readiness and evaluator proof re-bound at the qualified commit.'),
    ...row(["CCR-01556","CCR-02571","CCR-02572","CCR-02573","CCR-02576","CCR-02577","CCR-05468"],
      'P13.9',
      t('category13-authoritative-acceptance','P13.9 critic/optimizer proposals require requirement impact evidence dependencies and cannot self-apply'),
      t('category13-authoritative-acceptance','P13.9 critic/optimizer proposals require requirement impact evidence dependencies and cannot self-apply'),
      t('category13-authoritative-acceptance','P13.9 critic/optimizer proposals require requirement impact evidence dependencies and cannot self-apply'),
      'Recovered package membership P13.9; analytics measurement, observability, privacy, readiness and evaluator proof re-bound at the qualified commit.'),
    ...row(["CCR-00268","CCR-00300","CCR-00630","CCR-00653","CCR-00655","CCR-00660","CCR-00661","CCR-00662","CCR-00669","CCR-00672","CCR-00677","CCR-00681","CCR-00687","CCR-00704","CCR-00736","CCR-00837","CCR-00943","CCR-00944","CCR-01082","CCR-01083","CCR-01160","CCR-01181","CCR-01259","CCR-01261","CCR-01442","CCR-01570","CCR-01577","CCR-01602","CCR-01778","CCR-01844","CCR-01994","CCR-02090","CCR-02091","CCR-02096","CCR-02124","CCR-02174","CCR-02198","CCR-03105","CCR-03648","CCR-03860","CCR-04602","CCR-04805","CCR-04806","CCR-04807","CCR-04809","CCR-04810","CCR-04811","CCR-04812","CCR-04813","CCR-04814","CCR-04815","CCR-04820","CCR-04822","CCR-04824","CCR-04830","CCR-04832","CCR-04834","CCR-04836","CCR-04837","CCR-04838","CCR-04839","CCR-04849","CCR-04850","CCR-04851","CCR-04855","CCR-04856","CCR-04857","CCR-04859","CCR-04860","CCR-04863","CCR-04866","CCR-04868","CCR-04872","CCR-04873","CCR-04874","CCR-04875","CCR-04877","CCR-04884","CCR-04885","CCR-04887","CCR-04888","CCR-04890","CCR-04896","CCR-04897","CCR-04898","CCR-04899","CCR-04902","CCR-04903","CCR-04904","CCR-04907","CCR-04919","CCR-04923","CCR-04926","CCR-04927","CCR-04929","CCR-04930","CCR-04934","CCR-04937","CCR-04938","CCR-04939","CCR-04940","CCR-04942","CCR-04943","CCR-04944","CCR-04946","CCR-04947","CCR-04948","CCR-04949","CCR-04950","CCR-04951","CCR-05208","CCR-05295","CCR-05335","CCR-05337","CCR-05339","CCR-05343","CCR-05350","CCR-05359","CCR-05464","CCR-05665","CCR-05737","CCR-05738","CCR-05739","CCR-05742","CCR-05751","CCR-05753","CCR-05754","CCR-05755","CCR-05756","CCR-05763","CCR-05764","CCR-05765","CCR-05766","CCR-05767","CCR-05768","CCR-05775","CCR-05776","CCR-05779","CCR-05780","CCR-05784","CCR-05791","CCR-05792","CCR-05793","CCR-05794","CCR-05796","CCR-05797","CCR-05798","CCR-05799","CCR-05800","CCR-05801"],
      'P13.10',
      t('category13-authoritative-acceptance','P13.10 formula drift, duplicates, delays, privacy, and bounded high-volume behavior are measurable'),
      t('category13-durable-governance-evidence','P13.10 evaluator results bind evaluator benchmark reproducibility privacy calibration and scale'),
      t('category13-durable-governance-evidence','P13.10 evaluator results bind evaluator benchmark reproducibility privacy calibration and scale'),
      'Recovered package membership P13.10; analytics measurement, observability, privacy, readiness and evaluator proof re-bound at the qualified commit.'),
  ];
}
