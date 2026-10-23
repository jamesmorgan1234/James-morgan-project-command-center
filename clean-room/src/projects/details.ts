export interface ProjectDetailSectionDefinition {
  readonly key: string;
  readonly order: number;
  readonly projectTypeKeys: readonly string[];
  readonly title: string;
  readonly capability?: string;
}

export class ProjectDetailSectionRegistry {
  readonly #sections = new Map<string, ProjectDetailSectionDefinition>();

  register(section: ProjectDetailSectionDefinition): void {
    if (!section.key.startsWith("project-section:")) throw new Error(`Section key must start with project-section:: ${section.key}`);
    if (!Number.isSafeInteger(section.order) || section.order < 0) throw new Error("Section order must be a non-negative integer");
    if (!section.title.trim()) throw new Error("Section title is required");
    if (this.#sections.has(section.key)) throw new Error(`Project detail section already exists: ${section.key}`);
    this.#sections.set(section.key, Object.freeze({ ...section, projectTypeKeys: Object.freeze([...section.projectTypeKeys]) }));
  }

  remove(key: string): ProjectDetailSectionDefinition {
    const section = this.#sections.get(key);
    if (!section) throw new Error(`Unknown project detail section: ${key}`);
    this.#sections.delete(key);
    return section;
  }

  forProjectType(typeKey: string): readonly ProjectDetailSectionDefinition[] {
    return Object.freeze([...this.#sections.values()].filter((section) => section.projectTypeKeys.length === 0 || section.projectTypeKeys.includes(typeKey)).sort((a, b) => a.order - b.order));
  }
}

export function createCoreProjectSections(): ProjectDetailSectionRegistry {
  const sections = new ProjectDetailSectionRegistry();
  const universal: readonly [string, number, string][] = [
    ["snapshot", 10, "Snapshot"], ["owner-inputs", 20, "Owner Inputs"], ["history", 30, "History"], ["roadmap", 40, "Roadmap"], ["assets", 50, "Assets"], ["decisions", 60, "Decisions"], ["integrations", 70, "Integrations"], ["brain", 80, "Brain"], ["agency", 90, "Agency"], ["analytics", 100, "Analytics"]
  ];
  for (const [key, order, title] of universal) sections.register({ key: `project-section:${key}`, order, projectTypeKeys: [], title });
  return sections;
}
