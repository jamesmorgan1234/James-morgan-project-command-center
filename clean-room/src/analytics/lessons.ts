export type BuildLessonKind = "scope_drift" | "patch_stacking" | "lost_artifact" | "false_completion" | "bad_sequencing" | "handoff_friction" | "success_pattern";

export interface BuildLesson {
  readonly id: string;
  readonly kind: BuildLessonKind;
  readonly evidenceRefs: readonly string[];
  readonly sourceVersion: string;
  readonly statement: string;
  readonly improvementProposalRef: string;
  readonly autoApplied: false;
}

export function validateBuildLesson(lesson: BuildLesson): BuildLesson {
  if (!lesson.id.trim() || !lesson.sourceVersion.trim() || !lesson.statement.trim() || !lesson.improvementProposalRef.trim() || lesson.evidenceRefs.length === 0) throw new Error("build lesson requires evidence/version/proposal");
  if (lesson.autoApplied !== false) throw new Error("build lessons cannot silently mutate architecture");
  return Object.freeze({ ...lesson, evidenceRefs: Object.freeze([...lesson.evidenceRefs]) });
}
