export type BookApprovalKind = "title" | "cover" | "manuscript" | "rollout";

export interface BookApproval {
  readonly id: string;
  readonly bookId: string;
  readonly kind: BookApprovalKind;
  readonly targetVersion: number;
  readonly approved: boolean;
  readonly ownerActionRef: string;
  readonly decidedAt: string;
  readonly supersedesApprovalId: string | null;
}

export class BookApprovalLedger {
  readonly #entries: BookApproval[] = [];

  record(entry: BookApproval): BookApproval {
    if (!entry.id.trim() || !entry.bookId.trim() || !entry.ownerActionRef.trim() || entry.targetVersion < 1 || !entry.decidedAt.includes("T")) throw new Error("explicit owner approval evidence required");
    if (entry.supersedesApprovalId !== null && !this.#entries.some((item) => item.id === entry.supersedesApprovalId)) throw new Error("unknown superseded approval");
    const frozen = Object.freeze({ ...entry });
    this.#entries.push(frozen);
    return frozen;
  }

  current(bookId: string, kind: BookApprovalKind): BookApproval | undefined {
    return [...this.#entries].reverse().find((entry) => entry.bookId === bookId && entry.kind === kind);
  }
}
