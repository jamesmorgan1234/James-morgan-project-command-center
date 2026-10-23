export interface ReplaceableDependency {
  readonly key: string;
  readonly kind: "ai" | "storage" | "hosting" | "integration" | "model" | "provider";
  readonly health: "available" | "degraded" | "unavailable" | "retired" | "compromised";
  readonly adapterKey: string;
  readonly coreRewriteRequired: boolean;
  readonly capabilities: readonly string[];
}

export function replacementDisposition(dependency: ReplaceableDependency): "keep" | "degrade_locally" | "replace" {
  if (dependency.coreRewriteRequired) throw new Error("replaceable dependency contract cannot require core rewrite");
  if (dependency.health === "available") return "keep";
  if (dependency.health === "degraded") return "degrade_locally";
  return "replace";
}
