import { type ProjectRecord, type ProjectTypeDefinition } from "./types.js";
import { type ProjectInheritanceCandidate, type ProjectInheritancePlan } from "./inheritance.js";
export declare class ProjectTypeRegistry {
    #private;
    register(type: ProjectTypeDefinition): void;
    remove(key: string, expectedVersion: number): ProjectTypeDefinition;
    retainForProject(key: string): void;
    get(key: string): ProjectTypeDefinition | undefined;
    list(): readonly ProjectTypeDefinition[];
}
export declare class ProjectRegistry {
    #private;
    private readonly types;
    constructor(types: ProjectTypeRegistry);
    create(project: ProjectRecord, inheritancePlan?: ProjectInheritancePlan): void;
    replace(project: ProjectRecord, expectedVersion: number): void;
    get(id: string): ProjectRecord | undefined;
    list(includeArchived?: boolean): readonly ProjectRecord[];
    inheritedIntelligence(id: string): readonly ProjectInheritanceCandidate[];
}
