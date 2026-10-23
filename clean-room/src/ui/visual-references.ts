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

export const APPROVED_VISUAL_REFERENCES: Readonly<Record<ApprovedScreenKey, ApprovedVisualReference>> = Object.freeze({
  projects: Object.freeze({
    screen: "projects",
    approvedLegacyFilename: "3372(6).png",
    authority: "owner_approved",
    controls: Object.freeze(["screen hierarchy", "project card treatment", "progress rings", "status pills", "phone-first density", "orange machinery language"]),
    libraryStructuralMatch: Object.freeze({ fileId: "file_0000000043ac8230904160e928795e56", currentName: "image-gen-4(3).png", identityStatus: "structural_match_filename_unmapped" })
  }),
  active_live: Object.freeze({
    screen: "active_live",
    approvedLegacyFilename: "3369(5).png",
    authority: "owner_approved",
    controls: Object.freeze(["active project card structure", "scope display", "sync/activity facts", "status pills", "right-side art", "orange machinery language"]),
    libraryStructuralMatch: Object.freeze({ fileId: "file_0000000017c0820c9c0fea2d26126234", currentName: "image-gen-5(1).png", identityStatus: "structural_match_filename_unmapped" })
  }),
  next_up: Object.freeze({
    screen: "next_up",
    approvedLegacyFilename: "3373(5).png",
    authority: "owner_approved",
    controls: Object.freeze(["priority queue hierarchy", "dense beveled cards", "left icon frame", "status pill", "description", "right artwork and chevron"]),
    libraryStructuralMatch: Object.freeze({ fileId: "file_00000000110081f5b8492397e995297d", currentName: "image-gen-2(4).png", identityStatus: "structural_match_filename_unmapped" })
  }),
  project_detail_missing_hour: Object.freeze({
    screen: "project_detail_missing_hour",
    approvedLegacyFilename: "3370(4).png",
    authority: "owner_approved",
    controls: Object.freeze(["project hero", "performance card grid", "series asset strip", "publication status", "history row", "integration row"]),
    libraryStructuralMatch: Object.freeze({ fileId: "file_0000000039e481f690eb986eb0c18d0c", currentName: "image-gen-3(3).png", identityStatus: "structural_match_filename_unmapped" })
  })
});

export const APPROVED_SHARED_VISUAL_LANGUAGE = Object.freeze([
  "phone-first density",
  "near-black sci-fi canvas",
  "orange/gold illuminated machinery",
  "white primary headings",
  "muted blue-gray support text",
  "clipped/beveled geometry",
  "compact semantic status pills",
  "approved screen hierarchy",
  "approved card treatment",
  "truthful progress treatment",
  "machinery/icon language"
] as const);

export const REJECTED_VISUAL_PATTERNS = Object.freeze([
  "generic SaaS dashboard",
  "flat admin table as primary navigation",
  "static hand-entered progress percentage",
  "unverified revenue or performance figures",
  "visual structure invented as exact authority for an unseen screen"
] as const);
