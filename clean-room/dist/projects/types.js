import { parseTimestamp } from "../security/types.js";
export function assertProjectRecord(project) {
    if (!project.id?.trim() || !project.typeKey?.startsWith("project-type:") || !project.ownerId?.trim() || !project.name?.trim() || !project.mission?.trim() || !project.status?.trim())
        throw new Error("Project identity/type/owner/name/mission/status are required");
    if (project.status.trim().length > 120)
        throw new Error("Project status must be at most 120 characters");
    if (!Number.isSafeInteger(project.version) || project.version < 1)
        throw new Error("Project version must be a positive safe integer");
    const created = parseTimestamp(project.createdAt, "createdAt");
    const updated = parseTimestamp(project.updatedAt, "updatedAt");
    if (updated < created)
        throw new Error("Project updatedAt cannot predate createdAt");
}
//# sourceMappingURL=types.js.map