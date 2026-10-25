import { assertProjectRecord, type ProjectRecord, type ProjectTypeDefinition } from "./types.js";

const PROJECT_TYPE_KEY = /^project-type:[a-z0-9][a-z0-9._:-]{0,119}$/;

function assertNonblankUnique(values: readonly string[], label: string): void {
  if (values.some((value) => !value.trim())) throw new Error(`${label} entries cannot be blank`);
  if (new Set(values).size !== values.length) throw new Error(`${label} entries must be unique`);
}

export class ProjectTypeRegistry {
  readonly #types = new Map<string, ProjectTypeDefinition>();

  register(type: ProjectTypeDefinition): void {
    if (!PROJECT_TYPE_KEY.test(type.key)) throw new Error(`Invalid project type key: ${type.key}`);
    if (!Number.isSafeInteger(type.version) || type.version < 1) throw new Error("Project type version must be positive");
    if (!type.label.trim() || !type.domainPlaybookKey.trim()) throw new Error("Project type label and playbook are required");
    assertNonblankUnique(type.capabilities, "Project type capabilities");
    assertNonblankUnique(type.requiredDetailSections, "Project detail sections");
    if (this.#types.has(type.key)) throw new Error(`Project type already exists: ${type.key}`);
    this.#types.set(type.key, Object.freeze({ ...type, capabilities: Object.freeze([...type.capabilities]), requiredDetailSections: Object.freeze([...type.requiredDetailSections]) }));
  }

  remove(key: string, expectedVersion: number): ProjectTypeDefinition {
    const current = this.#types.get(key);
    if (!current) throw new Error(`Unknown project type: ${key}`);
    if (current.version !== expectedVersion) throw new Error(`Project type version conflict: ${key}`);
    this.#types.delete(key);
    return current;
  }

  get(key: string): ProjectTypeDefinition | undefined { return this.#types.get(key); }
  list(): readonly ProjectTypeDefinition[] { return Object.freeze([...this.#types.values()]); }
}

export class ProjectRegistry {
  readonly #projects = new Map<string, ProjectRecord>();
  constructor(private readonly types: ProjectTypeRegistry) {}

  create(project: ProjectRecord): void {
    assertProjectRecord(project);
    if (!this.types.get(project.typeKey)) throw new Error(`Unknown project type: ${project.typeKey}`);
    if (project.version !== 1) throw new Error("New project must start at version 1");
    if (this.#projects.has(project.id)) throw new Error(`Project already exists: ${project.id}`);
    this.#projects.set(project.id, Object.freeze({ ...project }));
  }

  replace(project: ProjectRecord, expectedVersion: number): void {
    assertProjectRecord(project);
    const current = this.#required(project.id);
    if (!this.types.get(project.typeKey)) throw new Error(`Unknown project type: ${project.typeKey}`);
    if (current.version !== expectedVersion || project.version !== current.version + 1) throw new Error(`Project version conflict: ${project.id}`);
    if (project.ownerId !== current.ownerId || project.createdAt !== current.createdAt) throw new Error("Project owner/creation identity cannot be rewritten");
    this.#projects.set(project.id, Object.freeze({ ...project }));
  }

  get(id: string): ProjectRecord | undefined { return this.#projects.get(id); }
  list(includeArchived = false): readonly ProjectRecord[] { return Object.freeze([...this.#projects.values()].filter((project) => includeArchived || project.lifecycle !== "archived")); }

  #required(id: string): ProjectRecord {
    const project = this.#projects.get(id);
    if (!project) throw new Error(`Unknown project: ${id}`);
    return project;
  }
}
