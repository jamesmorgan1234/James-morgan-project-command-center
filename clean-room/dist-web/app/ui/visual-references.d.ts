export type ApprovedScreenKey = "projects" | "active_live" | "next_up" | "project_detail_missing_hour";
export interface ApprovedVisualReference {
    readonly screen: ApprovedScreenKey;
    readonly approvedLegacyFilename: string;
    readonly authority: "owner_approved";
    readonly controls: readonly string[];
    readonly libraryStructuralMatch?: Readonly<{
        fileId: string;
        currentName: string;
        identityStatus: "structural_match_filename_unmapped";
    }>;
}
export declare const APPROVED_VISUAL_REFERENCES: Readonly<Record<ApprovedScreenKey, ApprovedVisualReference>>;
export declare const APPROVED_SHARED_VISUAL_LANGUAGE: readonly ["phone-first density", "near-black sci-fi canvas", "orange/gold illuminated machinery", "white primary headings", "muted blue-gray support text", "clipped/beveled geometry", "compact semantic status pills", "approved screen hierarchy", "approved card treatment", "truthful progress treatment", "machinery/icon language", "whole-card navigation for navigational cards", "no decorative arrows or chevrons on owner-facing cards"];
export declare const UNSEEN_SCREEN_DERIVATION_RULE: Readonly<{
    authority: "owner_approved";
    rule: "derive_not_redesign";
    sourceScreens: readonly ["projects", "active_live", "next_up", "project_detail_missing_hour"];
    requiredContinuity: readonly string[];
    discoveryPolicy: "additional historically approved screenshots may strengthen exact screen authority when verified, but absence of another screenshot does not block deriving necessary screens from the locked visual system";
    truthPolicy: "derived screens are labeled derived from approved visual language and are never falsely represented as pixel-identical historical screenshots";
}>;
export declare const REJECTED_VISUAL_PATTERNS: readonly ["generic SaaS dashboard", "flat admin table as primary navigation", "static hand-entered progress percentage", "unverified revenue or performance figures", "visual structure invented as exact authority for an unseen screen", "new modules switching to a different design system", "generic browser-default buttons that ignore the approved machinery language", "title-only navigation on cards that are themselves navigational", "decorative arrows or chevrons on owner-facing cards"];
