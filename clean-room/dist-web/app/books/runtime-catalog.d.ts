export interface RuntimeBookPublicationCell {
    readonly label: "Kindle eBook" | "KDP Select" | "Paperback" | "Hardcover";
    readonly value: string;
    readonly state: string;
}
export interface RuntimeBookProjectCatalog {
    readonly projectId: string;
    readonly relationshipLabel: string;
    readonly sectionLabel: string;
    readonly titles: readonly string[];
    readonly publication: readonly RuntimeBookPublicationCell[];
}
export declare function runtimeBookCatalogForProject(projectId: string): RuntimeBookProjectCatalog | undefined;
export declare function listRuntimeBookCatalog(): readonly RuntimeBookProjectCatalog[];
