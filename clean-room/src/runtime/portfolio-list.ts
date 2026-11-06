import type { RuntimeProjectSnapshot } from "./snapshot.js";

/** One registry-backed portfolio. Filters never define portfolio membership. */
export function portfolioProjects(projects: readonly RuntimeProjectSnapshot[], booksOnly = false): readonly RuntimeProjectSnapshot[] {
  const seen = new Set<string>();
  for (const project of projects) {
    if (seen.has(project.id)) throw new Error(`Duplicate canonical project identity: ${project.id}`);
    seen.add(project.id);
  }
  return Object.freeze(projects.filter(project => !booksOnly ||
    (project.typeKey?.state === "known" && project.typeKey.value === "project-type:book")));
}
