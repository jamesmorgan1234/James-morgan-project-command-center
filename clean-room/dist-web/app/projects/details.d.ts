export interface ProjectDetailSectionDefinition {
    readonly key: string;
    readonly order: number;
    readonly projectTypeKeys: readonly string[];
    readonly title: string;
    readonly capability?: string;
}
export declare class ProjectDetailSectionRegistry {
    #private;
    register(section: ProjectDetailSectionDefinition): void;
    remove(key: string): ProjectDetailSectionDefinition;
    forProjectType(typeKey: string): readonly ProjectDetailSectionDefinition[];
}
export declare function createCoreProjectSections(): ProjectDetailSectionRegistry;
