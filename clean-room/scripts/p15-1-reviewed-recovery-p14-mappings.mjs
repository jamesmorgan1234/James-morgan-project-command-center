/**
 * P14 recovery / migration / scale rows materialized from the recovered P1-P14 verified package.
 * Sub-phase ownership comes verbatim from evidence/P15_1_RECOVERED_P14_PHASE_MAP.json.
 */
export function reviewedRecoveryP14Mappings() {
  const t = (file, name) => `clean-room/tests/${file}.test.mjs :: ${name}`;
  const provenance = 'Recovered P1-P14 verified package P14_REPLACEMENT_AUTHORITY_ONLY.md (authority test report OVERALL PASS) reconciled through BULK_AUTHORITY_PARSE.json (sha256 df257f70...) and cross-checked against the canonical ledger recovery+dormant clusters (505 unique ids); current implementation and test bytes re-bound at the qualified commit.';
  const locations = ["clean-room/src/recovery/backup.ts#validateBackup","clean-room/src/recovery/restore.ts#validateRestore","clean-room/src/recovery/migrations.ts#dryRunMigration","clean-room/src/recovery/scale.ts#capacityDecision","clean-room/src/recovery/lifecycle.ts#assessRecoveryRevalidation"];
  const row = (ids, phase, positive, negative, notes) => ids.map((id) => ({
    id, owningPhases: [phase], dependencies: ['C0','C1','C2','C3'], dependenciesVerified: true,
    applicableCompaniesOrCapabilities: ['Command Center','Recovery / Migration / Scale'],
    implementationLocations: locations,
    tests: {
      positive: { applicable: true, references: [positive], justification: null },
      negative: { applicable: true, references: [negative], justification: null },
      failurePath: { applicable: true, references: [negative], justification: null }
    },
    evidence: [provenance], closureNotes: notes
  }));
  return [
    ...row(["CCR-00204","CCR-00610","CCR-01078","CCR-03930","CCR-05372","CCR-05533"],
      'P14.1',
      t('category14-authoritative-acceptance','P14.1 backup includes governed intelligence with encryption/integrity/retention/key strategy'),
      t('category14-durable-recovery-lifecycle','P14.1-P14.5 recovery migration replacement and historical evidence are durable'),
      'Recovered package membership P14.1; current implementation and named executable proof re-bound at the qualified commit.'),
    ...row(["CCR-00044","CCR-00205","CCR-00488","CCR-00606","CCR-00611","CCR-00614","CCR-00624","CCR-00851","CCR-01030","CCR-01426","CCR-01446","CCR-01656","CCR-01657","CCR-01658","CCR-01659","CCR-01660","CCR-01661","CCR-01662","CCR-01663","CCR-01664","CCR-01665","CCR-01666","CCR-01667","CCR-01668","CCR-01669","CCR-01674","CCR-01675","CCR-01676","CCR-01678","CCR-01679","CCR-01680","CCR-01681","CCR-01683","CCR-01684","CCR-01685","CCR-01687","CCR-01689","CCR-01690","CCR-01693","CCR-01694","CCR-01695","CCR-01701","CCR-01702","CCR-01704","CCR-01958","CCR-01962","CCR-01963","CCR-01964","CCR-01968","CCR-01969","CCR-01987","CCR-01999","CCR-02001","CCR-02189","CCR-02234","CCR-02242","CCR-02243","CCR-02368","CCR-02991","CCR-03155","CCR-03417","CCR-03420","CCR-03421","CCR-03430","CCR-03431","CCR-03432","CCR-03436","CCR-03437","CCR-03439","CCR-03440","CCR-03441","CCR-03442","CCR-03444","CCR-04922","CCR-05212","CCR-05386"],
      'P14.2',
      t('category14-authoritative-acceptance','P14.2 restore enforces current revocation privacy policy'),
      t('category14-durable-recovery-lifecycle','P14.1-P14.5 recovery migration replacement and historical evidence are durable'),
      'Recovered package membership P14.2; current implementation and named executable proof re-bound at the qualified commit.'),
    ...row(["CCR-00199","CCR-00699","CCR-00737","CCR-00867","CCR-00873","CCR-00911","CCR-00972","CCR-00975","CCR-01087","CCR-01217","CCR-01325","CCR-01326","CCR-01433","CCR-01436","CCR-01447","CCR-01448","CCR-01449","CCR-01450","CCR-01451","CCR-01452","CCR-01453","CCR-01490","CCR-01829","CCR-02175","CCR-02992","CCR-02996","CCR-03445","CCR-03867","CCR-03868","CCR-04372","CCR-04532","CCR-05199","CCR-05667","CCR-05774"],
      'P14.3',
      t('category14-authoritative-acceptance','P14.3 migration rollback preserves erasure'),
      t('category14-durable-recovery-lifecycle','P14.1-P14.5 recovery migration replacement and historical evidence are durable'),
      'Recovered package membership P14.3; current implementation and named executable proof re-bound at the qualified commit.'),
    ...row(["CCR-01722","CCR-01723","CCR-01724","CCR-01725","CCR-01731","CCR-01735","CCR-01752","CCR-01772","CCR-01774","CCR-03498","CCR-03499","CCR-03500","CCR-03501","CCR-03510","CCR-03514","CCR-03515","CCR-03517","CCR-04082"],
      'P14.4',
      t('category14-authoritative-acceptance','P14.4 replacement default-denies unavailable paid/unknown or incompatible candidates'),
      t('category14-durable-recovery-lifecycle','P14.1-P14.5 recovery migration replacement and historical evidence are durable'),
      'Recovered package membership P14.4; current implementation and named executable proof re-bound at the qualified commit.'),
    ...row(["CCR-00201","CCR-00203","CCR-01697","CCR-01814","CCR-01900","CCR-05196","CCR-05200"],
      'P14.5',
      t('category14-authoritative-acceptance','P14.5 historical recovery keeps unavailable CCR evidence visible'),
      t('category14-durable-recovery-lifecycle','P14.1-P14.5 recovery migration replacement and historical evidence are durable'),
      'Recovered package membership P14.5; current implementation and named executable proof re-bound at the qualified commit.'),
    ...row(["CCR-01738","CCR-01773","CCR-03728","CCR-03729","CCR-03761","CCR-03762","CCR-03763","CCR-03765","CCR-03770","CCR-03824"],
      'P14.6',
      t('category14-authoritative-acceptance','P14.6 scale accepts bounded backpressure but never loss or budget overrun'),
      t('category14-durable-recovery-lifecycle','P14.6 scale evidence includes 10x and 100x exercises'),
      'Recovered package membership P14.6; current implementation and named executable proof re-bound at the qualified commit.'),
    ...row(["CCR-01052","CCR-01705","CCR-01706","CCR-01707","CCR-01708","CCR-01709","CCR-01710","CCR-01711","CCR-01712","CCR-01713","CCR-01714","CCR-01715","CCR-01716","CCR-01719","CCR-01720","CCR-01721","CCR-01743","CCR-01744","CCR-01755","CCR-01762","CCR-01768","CCR-03520","CCR-03522","CCR-03526","CCR-03548","CCR-03549","CCR-03552","CCR-03553","CCR-03554","CCR-03556","CCR-03559","CCR-03564","CCR-03565","CCR-03566","CCR-03567","CCR-03568","CCR-03569","CCR-03570","CCR-03571","CCR-03572","CCR-03573","CCR-03574","CCR-03575","CCR-03576","CCR-03578","CCR-03579","CCR-03582","CCR-03602","CCR-03609","CCR-03610","CCR-03612","CCR-03613","CCR-03617","CCR-03618","CCR-03619","CCR-03629","CCR-03630","CCR-03631","CCR-03632","CCR-03633","CCR-03634","CCR-03635","CCR-03636","CCR-03638","CCR-03641","CCR-03644","CCR-03646","CCR-03647","CCR-03649","CCR-03650","CCR-03651","CCR-03652","CCR-03653","CCR-03654","CCR-03657","CCR-03658","CCR-03659","CCR-03660","CCR-03661","CCR-03662","CCR-03663","CCR-03664","CCR-03665","CCR-03666","CCR-03667","CCR-03668","CCR-03669","CCR-03670","CCR-03671","CCR-03672","CCR-03673","CCR-03674","CCR-03675","CCR-03676","CCR-03677","CCR-03678","CCR-03679","CCR-03680","CCR-03681","CCR-03682","CCR-03683","CCR-03684","CCR-03689","CCR-03692","CCR-03693","CCR-03705","CCR-03767","CCR-03768","CCR-03773","CCR-03787","CCR-03788","CCR-03790","CCR-03794","CCR-03819","CCR-03820","CCR-03821","CCR-03825","CCR-03826","CCR-03829","CCR-03830","CCR-03831","CCR-03832","CCR-03833","CCR-03859","CCR-03861","CCR-03862","CCR-03863","CCR-03864","CCR-03866","CCR-03874","CCR-03894","CCR-03896","CCR-03897","CCR-03898","CCR-03899","CCR-03901","CCR-03902","CCR-03903","CCR-03904","CCR-03905","CCR-03907","CCR-03908","CCR-03909","CCR-03910","CCR-03911","CCR-03912","CCR-03913","CCR-03924","CCR-03936","CCR-03937","CCR-03938","CCR-03941","CCR-03944","CCR-03945","CCR-03949","CCR-03951","CCR-03952","CCR-03953","CCR-03955","CCR-03956","CCR-03957","CCR-03958","CCR-03959","CCR-03961","CCR-03964","CCR-03965","CCR-03967","CCR-03968","CCR-03969","CCR-03973","CCR-03974","CCR-03975","CCR-03976","CCR-03980","CCR-03981","CCR-03982","CCR-03983","CCR-03984","CCR-03985","CCR-03986","CCR-03987","CCR-03988","CCR-03989","CCR-03990","CCR-03991","CCR-03993","CCR-03994","CCR-03996","CCR-03998","CCR-03999","CCR-04000","CCR-04001","CCR-04002","CCR-04003","CCR-04004","CCR-04005","CCR-04006","CCR-04008","CCR-04010","CCR-04011","CCR-04012","CCR-04013","CCR-04016","CCR-04018","CCR-04019","CCR-04020","CCR-04021","CCR-04022","CCR-04026","CCR-04055","CCR-04062","CCR-04066","CCR-04068","CCR-04069","CCR-04070","CCR-04072","CCR-04073","CCR-04079","CCR-04081","CCR-04092","CCR-04096","CCR-04097","CCR-04098","CCR-04099","CCR-04101","CCR-04102","CCR-04103","CCR-04105","CCR-04106","CCR-04107","CCR-04108","CCR-04110","CCR-05023"],
      'P14.7',
      t('category14-authoritative-acceptance','P14.7 dormant reactivation requires ordered CONFIGURE CONNECT AUTHORIZE ENABLE'),
      t('category14-durable-recovery-lifecycle','P14.7 dormant state requires current-policy and revocation revalidation'),
      'Recovered package membership P14.7; current implementation and named executable proof re-bound at the qualified commit.'),
    ...row(["CCR-00788","CCR-01053","CCR-01760","CCR-01761","CCR-01763","CCR-01764","CCR-01765","CCR-03637","CCR-03687","CCR-03688","CCR-03691","CCR-03694","CCR-03695","CCR-03696","CCR-03697","CCR-03698","CCR-03700","CCR-03701","CCR-03702","CCR-03703","CCR-05171","CCR-05572"],
      'P14.8',
      t('category14-authoritative-acceptance','P14.8 synthetic multi-user seam proves separation without activating multi-user product'),
      t('category14-durable-recovery-lifecycle','P14.8-P14.10 future boundaries cannot inherit private state'),
      'Recovered package membership P14.8; current implementation and named executable proof re-bound at the qualified commit.'),
    ...row(["CCR-01759","CCR-01767","CCR-03835","CCR-03836","CCR-03838","CCR-03840","CCR-03841","CCR-03845","CCR-03846","CCR-03847","CCR-03848","CCR-03849","CCR-03850","CCR-03851","CCR-03852","CCR-03853","CCR-03854","CCR-04075","CCR-04080","CCR-04083","CCR-04084","CCR-04089","CCR-04100","CCR-04104","CCR-04109","CCR-05704"],
      'P14.9',
      t('category14-durable-recovery-lifecycle','P14.8-P14.10 future boundaries cannot inherit private state'),
      t('category14-durable-recovery-lifecycle','P14.8-P14.10 future boundaries cannot inherit private state'),
      'Recovered package membership P14.9; current implementation and named executable proof re-bound at the qualified commit.'),
    ...row(["CCR-01729","CCR-01730","CCR-01732","CCR-01736","CCR-03708","CCR-03709","CCR-03710","CCR-03711","CCR-03712","CCR-03714","CCR-03715","CCR-03716","CCR-03717","CCR-03718","CCR-03720","CCR-03721","CCR-03723","CCR-03724","CCR-03725","CCR-03931","CCR-04015","CCR-04017","CCR-04023","CCR-04027","CCR-04028","CCR-04029"],
      'P14.10',
      t('category14-durable-recovery-lifecycle','P14.8-P14.10 future boundaries cannot inherit private state'),
      t('category14-durable-recovery-lifecycle','P14.8-P14.10 future boundaries cannot inherit private state'),
      'Recovered package membership P14.10; current implementation and named executable proof re-bound at the qualified commit.'),
    ...row(["CCR-01749","CCR-01750","CCR-01753","CCR-03857","CCR-03858"],
      'P14.11',
      t('category14-durable-recovery-lifecycle','P14.11 simulation chaos shadow and failover prohibit production side effects'),
      t('category14-durable-recovery-lifecycle','P14.11 simulation chaos shadow and failover prohibit production side effects'),
      'Recovered package membership P14.11; current implementation and named executable proof re-bound at the qualified commit.'),
    ...row(["CCR-01745","CCR-01747","CCR-03527","CCR-03529","CCR-03530","CCR-03531","CCR-03532","CCR-03606","CCR-03607","CCR-03906","CCR-03962","CCR-03963"],
      'P14.12',
      t('category14-durable-recovery-lifecycle','P14.12 long-horizon drift external reality causal and replacement audits are explicit'),
      t('category14-durable-recovery-lifecycle','P14.12 long-horizon drift external reality causal and replacement audits are explicit'),
      'Recovered package membership P14.12; current implementation and named executable proof re-bound at the qualified commit.'),
  ];
}
