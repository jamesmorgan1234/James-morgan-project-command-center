export type ImprovementArea = "roadmap_gap" | "manual_work" | "fragility" | "provider" | "cost" | "security" | "historical_lesson" | "quality";
export interface ImprovementProposal {
    readonly id: string;
    readonly area: ImprovementArea;
    readonly title: string;
    readonly evidenceRefs: readonly string[];
    readonly confidence: number;
    readonly installsAutomatically: false;
}
export declare function createImprovementProposal(input: Omit<ImprovementProposal, "installsAutomatically">): ImprovementProposal;
