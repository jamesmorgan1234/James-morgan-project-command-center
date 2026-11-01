export type BookRelationshipKind = "standalone" | "series" | "trilogy" | "collection" | "umbrella";
export type BookFormat = "kindle" | "paperback" | "hardcover" | "digital_other";
export interface AuthorIdentity {
    readonly id: string;
    readonly displayName: string;
    readonly sourceRefs: readonly string[];
}
export interface BookRecord {
    readonly id: string;
    readonly projectId: string;
    readonly authorId: string;
    readonly canonicalTitle: string;
    readonly relationshipKind: BookRelationshipKind;
    readonly parentBookId: string | null;
    readonly sequence: number | null;
    readonly formats: readonly BookFormat[];
    readonly bookType: string;
    readonly version: number;
}
export declare class BookRegistry {
    #private;
    registerBookType(key: string): void;
    registerAuthor(author: AuthorIdentity): AuthorIdentity;
    registerBook(book: BookRecord): BookRecord;
    hierarchy(parentBookId: string): readonly BookRecord[];
    list(): readonly BookRecord[];
}
export type BookHierarchyNodeRole = "work" | "container";
export interface EvidenceBackedAuthorIdentity {
    readonly id: string;
    readonly ownerId: string;
    readonly displayName: string;
    readonly aliases: readonly string[];
    readonly sourceRefs: readonly string[];
    readonly observedAt: string;
    readonly version: number;
}
export interface BookTypeDefinition {
    readonly key: string;
    readonly label: string;
    readonly rendererKey: string;
    readonly allowedRelationshipKinds: readonly BookRelationshipKind[];
    readonly sourceRefs: readonly string[];
    readonly version: number;
}
export interface BookHierarchyNode {
    readonly id: string;
    readonly ownerId: string;
    readonly projectId: string;
    readonly authorId: string;
    readonly canonicalTitle: string;
    readonly relationshipKind: BookRelationshipKind;
    readonly nodeRole: BookHierarchyNodeRole;
    readonly parentBookId: string | null;
    readonly sequence: number | null;
    readonly formats: readonly BookFormat[];
    readonly bookType: string;
    readonly sourceRefs: readonly string[];
    readonly observedAt: string;
    readonly version: number;
}
export interface RenderableBookHierarchyNode {
    readonly id: string;
    readonly projectId: string;
    readonly canonicalTitle: string;
    readonly relationshipKind: BookRelationshipKind;
    readonly nodeRole: BookHierarchyNodeRole;
    readonly sequence: number | null;
    readonly formats: readonly BookFormat[];
    readonly bookType: string;
    readonly rendererKey: string;
    readonly depth: number;
}
export declare class EvidenceBackedBookRegistry {
    #private;
    registerAuthor(author: EvidenceBackedAuthorIdentity): EvidenceBackedAuthorIdentity;
    registerBookType(definition: BookTypeDefinition): BookTypeDefinition;
    registerBook(book: BookHierarchyNode): BookHierarchyNode;
    hierarchy(rootBookId: string): readonly BookHierarchyNode[];
    renderHierarchy(rootBookId: string): readonly RenderableBookHierarchyNode[];
    list(ownerId?: string): readonly BookHierarchyNode[];
    requireExact(id: string, ownerId: string, projectId: string, version: number): BookHierarchyNode;
    private assertNoCycle;
}
