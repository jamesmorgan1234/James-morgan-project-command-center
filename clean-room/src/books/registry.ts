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
