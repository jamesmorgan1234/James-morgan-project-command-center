export class ProjectDetailSectionRegistry {
    #sections = new Map();
    register(section) {
        if (!section.key.startsWith("project-section:"))
            throw new Error(`Section key must start with project-section:: ${section.key}`);
        if (!Number.isSafeInteger(section.order) || section.order < 0)
            throw new Error("Section order must be a non-negative integer");
        if (!section.title.trim())
            throw new Error("Section title is required");
        if (this.#sections.has(section.key))
            throw new Error(`Project detail section already exists: ${section.key}`);
        this.#sections.set(section.key, Object.freeze({ ...section, projectTypeKeys: Object.freeze([...section.projectTypeKeys]) }));
    }
    remove(key) {
        const section = this.#sections.get(key);
        if (!section)
            throw new Error(`Unknown project detail section: ${key}`);
        this.#sections.delete(key);
        return section;
    }
    forProjectType(typeKey) {
        return Object.freeze([...this.#sections.values()].filter((section) => section.projectTypeKeys.length === 0 || section.projectTypeKeys.includes(typeKey)).sort((a, b) => a.order - b.order));
    }
}
export function createCoreProjectSections() {
    const sections = new ProjectDetailSectionRegistry();
    const universal = [
        ["snapshot", 10, "Snapshot"],
        ["owner-inputs", 20, "Owner Inputs"],
        ["history", 30, "History"],
        ["roadmap", 40, "Roadmap"],
        ["assets", 50, "Assets"],
        ["decisions", 60, "Decisions"],
        ["integrations", 70, "Integrations"],
        ["brain", 80, "Brain"],
        ["agency", 90, "Agency"],
        ["analytics", 100, "Analytics"],
        ["conversation", 110, "Conversation"]
    ];
    for (const [key, order, title] of universal)
        sections.register({ key: `project-section:${key}`, order, projectTypeKeys: [], title });
    return sections;
}
//# sourceMappingURL=details.js.map