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

export class BookRegistry {
  readonly #authors = new Map<string, AuthorIdentity>();
  readonly #books = new Map<string, BookRecord>();
  readonly #bookTypes = new Set<string>();

  registerBookType(key: string): void {
    if (!key.trim()) throw new Error("book type key required");
    this.#bookTypes.add(key);
  }

  registerAuthor(author: AuthorIdentity): AuthorIdentity {
    if (!author.id.trim() || !author.displayName.trim() || author.sourceRefs.length === 0) throw new Error("author identity/provenance required");
    const frozen = Object.freeze({ ...author, sourceRefs: Object.freeze([...author.sourceRefs]) });
    this.#authors.set(author.id, frozen);
    return frozen;
  }

  registerBook(book: BookRecord): BookRecord {
    if (!this.#authors.has(book.authorId)) throw new Error("unknown author");
    if (!this.#bookTypes.has(book.bookType)) throw new Error("unregistered book type");
    if (!book.id.trim() || !book.projectId.trim() || !book.canonicalTitle.trim() || book.version < 1) throw new Error("book identity/title/version required");
    if (book.parentBookId !== null && !this.#books.has(book.parentBookId)) throw new Error("unknown parent book");
    const current = this.#books.get(book.id);
    if (current && book.version <= current.version) throw new Error("book version must advance");
    const frozen = Object.freeze({ ...book, formats: Object.freeze([...book.formats]) });
    this.#books.set(book.id, frozen);
    return frozen;
  }

  hierarchy(parentBookId: string): readonly BookRecord[] {
    return Object.freeze([...this.#books.values()].filter((book) => book.id === parentBookId || book.parentBookId === parentBookId).sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0)));
  }

  list(): readonly BookRecord[] {
    return Object.freeze([...this.#books.values()]);
  }
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

function bookRefs(values: readonly string[], label: string, requireOne = true): readonly string[] {
  if (!Array.isArray(values) || (requireOne && values.length === 0) || values.some((value) => typeof value !== "string" || !value.trim())) throw new Error(`${label} must contain nonblank values`);
  const normalized = values.map((value) => value.trim());
  if (new Set(normalized).size !== normalized.length) throw new Error(`${label} cannot contain duplicates`);
  return Object.freeze(normalized);
}

function bookTimestamp(value: string, label: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`${label} must be an ISO-compatible timestamp`);
  return parsed;
}

function positiveBookVersion(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 1) throw new Error(`${label} must be a positive integer`);
}

export class EvidenceBackedBookRegistry {
  readonly #authors = new Map<string, EvidenceBackedAuthorIdentity>();
  readonly #bookTypes = new Map<string, BookTypeDefinition>();
  readonly #books = new Map<string, BookHierarchyNode>();

  registerAuthor(author: EvidenceBackedAuthorIdentity): EvidenceBackedAuthorIdentity {
    if (!author.id.trim() || !author.ownerId.trim() || !author.displayName.trim()) throw new Error("author identity/owner/display name are required");
    positiveBookVersion(author.version, "author version");
    bookTimestamp(author.observedAt, "author observedAt");
    const aliases = bookRefs(author.aliases, "author aliases", false);
    const sourceRefs = bookRefs(author.sourceRefs, "author source refs");
    const current = this.#authors.get(author.id);
    if (current) {
      if (current.ownerId !== author.ownerId) throw new Error("canonical author identity cannot cross owner boundary");
      if (author.version <= current.version) throw new Error("author version must advance");
    }
    const frozen = Object.freeze({ ...author, aliases, sourceRefs });
    this.#authors.set(author.id, frozen);
    return frozen;
  }

  registerBookType(definition: BookTypeDefinition): BookTypeDefinition {
    if (!definition.key.trim() || !definition.label.trim() || !definition.rendererKey.trim()) throw new Error("book type key/label/renderer are required");
    positiveBookVersion(definition.version, "book type version");
    const allowedRelationshipKinds = bookRefs(definition.allowedRelationshipKinds, "book type relationship kinds") as readonly BookRelationshipKind[];
    const sourceRefs = bookRefs(definition.sourceRefs, "book type source refs");
    const current = this.#bookTypes.get(definition.key);
    if (current) {
      if (current.rendererKey !== definition.rendererKey) throw new Error("book type renderer identity cannot be silently substituted");
      if (definition.version <= current.version) throw new Error("book type version must advance");
    }
    const frozen = Object.freeze({ ...definition, allowedRelationshipKinds, sourceRefs });
    this.#bookTypes.set(definition.key, frozen);
    return frozen;
  }

  registerBook(book: BookHierarchyNode): BookHierarchyNode {
    if (!book.id.trim() || !book.ownerId.trim() || !book.projectId.trim() || !book.authorId.trim() || !book.canonicalTitle.trim() || !book.bookType.trim()) throw new Error("book identity/owner/project/author/title/type are required");
    positiveBookVersion(book.version, "book version");
    bookTimestamp(book.observedAt, "book observedAt");
    const author = this.#authors.get(book.authorId);
    if (!author || author.ownerId !== book.ownerId) throw new Error("book requires exact owner-scoped author identity");
    const type = this.#bookTypes.get(book.bookType);
    if (!type) throw new Error("unregistered book type");
    if (!type.allowedRelationshipKinds.includes(book.relationshipKind)) throw new Error("book relationship kind is not allowed by registered book type");
    if (book.nodeRole === "work" && book.relationshipKind !== "standalone") throw new Error("work nodes must use standalone relationship kind");
    if (book.nodeRole === "container" && book.relationshipKind === "standalone") throw new Error("container nodes cannot use standalone relationship kind");
    const formats = bookRefs(book.formats, "book formats", book.nodeRole === "work") as readonly BookFormat[];
    const sourceRefs = bookRefs(book.sourceRefs, "book source refs");
    if (book.parentBookId === null) {
      if (book.sequence !== null) throw new Error("root book/container cannot carry sibling sequence");
    } else {
      if (!Number.isSafeInteger(book.sequence) || (book.sequence ?? 0) < 1) throw new Error("child book requires positive integer sequence");
      if (book.parentBookId === book.id) throw new Error("book cannot parent itself");
      const parent = this.#books.get(book.parentBookId);
      if (!parent || parent.ownerId !== book.ownerId || parent.nodeRole !== "container") throw new Error("book parent must be an existing owner-scoped container");
      this.assertNoCycle(book.id, parent.id);
      const siblingConflict = [...this.#books.values()].find((candidate) => candidate.id !== book.id && candidate.ownerId === book.ownerId && candidate.parentBookId === book.parentBookId && candidate.sequence === book.sequence);
      if (siblingConflict) throw new Error("sibling sequence is already occupied");
      if (parent.relationshipKind === "trilogy") {
        const siblingWorks = [...this.#books.values()].filter((candidate) => candidate.id !== book.id && candidate.parentBookId === parent.id && candidate.nodeRole === "work");
        if (book.nodeRole === "work" && siblingWorks.length >= 3) throw new Error("trilogy cannot contain more than three direct work nodes");
        if (book.nodeRole === "work" && (book.sequence ?? 0) > 3) throw new Error("trilogy work sequence cannot exceed three");
      }
    }
    const current = this.#books.get(book.id);
    if (current) {
      if (current.ownerId !== book.ownerId || current.projectId !== book.projectId || current.authorId !== book.authorId || current.bookType !== book.bookType || current.nodeRole !== book.nodeRole || current.relationshipKind !== book.relationshipKind || current.parentBookId !== book.parentBookId) throw new Error("canonical book hierarchy lineage cannot be silently substituted");
      if (book.version <= current.version) throw new Error("book version must advance");
    }
    const frozen = Object.freeze({ ...book, formats, sourceRefs });
    this.#books.set(book.id, frozen);
    return frozen;
  }

  hierarchy(rootBookId: string): readonly BookHierarchyNode[] {
    const root = this.#books.get(rootBookId);
    if (!root) throw new Error("unknown book hierarchy root");
    const output: BookHierarchyNode[] = [];
    const visit = (node: BookHierarchyNode): void => {
      output.push(node);
      const children = [...this.#books.values()].filter((candidate) => candidate.parentBookId === node.id).sort((left, right) => (left.sequence ?? 0) - (right.sequence ?? 0) || left.canonicalTitle.localeCompare(right.canonicalTitle));
      for (const child of children) visit(child);
    };
    visit(root);
    return Object.freeze(output);
  }

  renderHierarchy(rootBookId: string): readonly RenderableBookHierarchyNode[] {
    const hierarchy = this.hierarchy(rootBookId);
    const depthFor = (node: BookHierarchyNode): number => {
      let depth = 0;
      let parentId = node.parentBookId;
      while (parentId !== null) {
        const parent = this.#books.get(parentId);
        if (!parent) throw new Error("book hierarchy contains missing parent");
        depth += 1;
        parentId = parent.parentBookId;
      }
      return depth;
    };
    return Object.freeze(hierarchy.map((book) => {
      const type = this.#bookTypes.get(book.bookType);
      if (!type) throw new Error("book type disappeared from registry");
      return Object.freeze({ id: book.id, projectId: book.projectId, canonicalTitle: book.canonicalTitle, relationshipKind: book.relationshipKind, nodeRole: book.nodeRole, sequence: book.sequence, formats: book.formats, bookType: book.bookType, rendererKey: type.rendererKey, depth: depthFor(book) });
    }));
  }

  list(ownerId?: string): readonly BookHierarchyNode[] {
    const books = [...this.#books.values()];
    return Object.freeze(ownerId === undefined ? books : books.filter((book) => book.ownerId === ownerId));
  }

  requireExact(id: string, ownerId: string, projectId: string, version: number): BookHierarchyNode {
    const book = this.#books.get(id);
    if (!book || book.ownerId !== ownerId || book.projectId !== projectId || book.version !== version) throw new Error("exact book registry identity/version mismatch");
    return book;
  }

  private assertNoCycle(bookId: string, parentId: string): void {
    let cursor: string | null = parentId;
    while (cursor !== null) {
      if (cursor === bookId) throw new Error("book hierarchy cycle detected");
      const node: BookHierarchyNode | undefined = this.#books.get(cursor);
      cursor = node?.parentBookId ?? null;
    }
  }
}
