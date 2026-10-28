/** Resolve the existing integrated authority; never let a historic source become current implicitly. */
export function assertCurrentArchitectureAuthority(manifest, overlay) {
  const currentRoadmap = 'roadmap/master-build-plan-owner-review/22_COMPLETE_199_PHASE_CURRENT_MASTER_ROADMAP_AUDIT_CANDIDATE.md';
  const currentManifest = 'roadmap/master-build-plan-owner-review/23_CURRENT_199_PHASE_MACHINE_MANIFEST.json';
  if (manifest?.owner !== 'James Morgan' || manifest?.status !== 'CURRENT_BUILD_AUTHORITY'
      || manifest?.sourceRoadmap !== currentRoadmap
      || overlay?.currentAuthority?.roadmap !== currentRoadmap
      || overlay?.currentAuthority?.manifest !== currentManifest
      || overlay?.rules?.historicalSourceIsImmutable !== true
      || overlay?.rules?.canonicalIdsAreImmutable !== true
      || overlay?.rules?.sourceIdsAreImmutable !== true
      || overlay?.rules?.effectiveClassificationOverridesHistoricalForCurrentConsumers !== true
      || overlay?.rules?.historicalClassificationRemainsAuditable !== true) {
    throw new Error('Current architecture authority declarations conflict or are missing; historical sources cannot govern implicitly');
  }
  return currentRoadmap;
}
