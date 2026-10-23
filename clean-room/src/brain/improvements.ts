export type ImprovementArea = "roadmap_gap" | "manual_work" | "fragility" | "provider" | "cost" | "security" | "historical_lesson" | "quality";

export interface ImprovementProposal {
  readonly id: string;
  readonly area: ImprovementArea;
  readonly title: string;
  readonly evidenceRefs: readonly string[];
  readonly confidence: number;
  readonly installsAutomatically: false;
}

export function createImprovementProposal(input: Omit<ImprovementProposal, "installsAutomatically">): ImprovementProposal {
  if (!input.id.trim() || !input.title.trim() || input.evidenceRefs.length === 0) throw new Error("Improvement proposal requires identity/title/evidence");
  if (!Number.isFinite(input.confidence) || input.confidence < 0 || input.confidence > 1) throw new Error("Improvement confidence must be 0..1");
  return Object.freeze({ ...input, evidenceRefs: Object.freeze([...input.evidenceRefs]), installsAutomatically: false as const });
}
