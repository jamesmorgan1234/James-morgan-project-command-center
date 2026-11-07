/**
 * Route a canonical owner/Brain turn to the already-proven PC read-only queue.
 * This is deliberately NOT the general project-executor/tool readiness flag.
 * Membership comes only from an authenticated owner-RLS live evidence view.
 * The server independently validates the exact owner, project, specialist,
 * provider, saved turn and no-paid/no-company-build boundaries.
 */
export function shouldQueuePcBrainResponse(projectId, scopedVerifiedProjectIds, generalReadiness) {
  if (projectId === undefined || projectId === null) return true; // Existing central Brain.
  if (typeof projectId !== 'string' || !projectId.trim()) return false;
  if (Array.isArray(scopedVerifiedProjectIds) && scopedVerifiedProjectIds.includes(projectId)) return true;
  return generalReadiness?.[projectId] === 'available'; // Existing behavior, no widened authority.
}
