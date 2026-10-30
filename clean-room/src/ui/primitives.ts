import { COMMAND_CENTER_GEOMETRY } from "./design-tokens.js";

export type PrimitiveKind =
  | "card"
  | "row"
  | "status_pill"
  | "progress"
  | "expansion"
  | "dialog"
  | "button"
  | "loader"
  | "empty_state"
  | "zero_state"
  | "error_state"
  | "tooltip"
  | "health_badge"
  | "freshness_badge"
  | "confidence_indicator"
  | "source_trust_label"
  | "stale_data_banner"
  | "provider_state_panel"
  | "missing_source_panel"
  | "conflict_panel"
  | "approval_card"
  | "obligation_card"
  | "audit_row"
  | "reversible_action"
  | "destructive_confirm_dialog"
  | "offline_state";

export type PrimitiveInteraction = "none" | "navigate" | "activate" | "toggle" | "dismiss" | "inform" | "confirm" | "reverse";

export interface PrimitiveContract {
  readonly kind: PrimitiveKind;
  readonly interaction: PrimitiveInteraction;
  readonly semanticElement: "article" | "a" | "button" | "div" | "dialog" | "progress" | "span";
  readonly minimumTargetPx: number;
  readonly requiresAccessibleName: boolean;
  readonly usesMachineryVisualLanguage: boolean;
  readonly permitsDecorativeChevron: false;
  readonly privateTruthPolicy: "canonical_or_safe_fixed_copy";
  readonly notes: readonly string[];
}

export interface SemanticComponentState {
  readonly state: string;
  readonly label: string;
  readonly observedAt?: string;
  readonly sourceRef?: string;
  readonly remediationRoute?: string;
  readonly auditRef?: string;
  readonly recoveryRef?: string;
}

function contract(
  kind: PrimitiveKind,
  interaction: PrimitiveInteraction,
  semanticElement: PrimitiveContract["semanticElement"],
  options: Partial<Pick<PrimitiveContract, "minimumTargetPx" | "requiresAccessibleName" | "usesMachineryVisualLanguage">> = {},
  notes: readonly string[] = []
): PrimitiveContract {
  return Object.freeze({
    kind,
    interaction,
    semanticElement,
    minimumTargetPx: options.minimumTargetPx ?? (interaction === "none" || interaction === "inform" ? 0 : COMMAND_CENTER_GEOMETRY.primaryTapTarget),
    requiresAccessibleName: options.requiresAccessibleName ?? (interaction !== "none" && interaction !== "inform"),
    usesMachineryVisualLanguage: options.usesMachineryVisualLanguage ?? true,
    permitsDecorativeChevron: false as const,
    privateTruthPolicy: "canonical_or_safe_fixed_copy" as const,
    notes: Object.freeze([...notes])
  });
}

export const COMMAND_CENTER_PRIMITIVES: Readonly<Record<PrimitiveKind, PrimitiveContract>> = Object.freeze({
  card: contract("card", "none", "article", {}, ["Beveled/clipped shared surface; navigational cards use the navigation-card contract rather than title-only links."]),
  row: contract("row", "none", "article", {}, ["Dense shared row geometry; rows do not invent screen-specific visual systems."]),
  status_pill: contract("status_pill", "inform", "span", {}, ["State must be communicated by text/semantics, never color alone."]),
  progress: contract("progress", "inform", "progress", {}, ["Unknown or unverified denominators render N/A rather than fabricated percentages."]),
  expansion: contract("expansion", "toggle", "button", {}, ["Toggle exposes expanded state and controls relationship; keyboard activation is required."]),
  dialog: contract("dialog", "dismiss", "dialog", {}, ["Modal dialogs require an accessible name, focus containment/return, Escape handling, and explicit dismissal semantics."]),
  button: contract("button", "activate", "button", {}, ["Uses the shared beveled machinery control language and visible focus treatment."]),
  loader: contract("loader", "inform", "div", { usesMachineryVisualLanguage: true }, ["Loading copy is fixed/non-private until canonical data is authorized to render."]),
  empty_state: contract("empty_state", "inform", "article", {}, ["Empty means canonical data is loaded and known empty; it must not substitute for unavailable truth."]),
  zero_state: contract("zero_state", "inform", "article", {}, ["Zero is shown only when canonical truth verifies zero; unknown/unavailable remains N/A or unavailable."]),
  error_state: contract("error_state", "inform", "article", {}, ["Owner-visible errors use safe fixed copy; secrets, stack traces and private payloads are excluded."]),
  tooltip: contract("tooltip", "inform", "span", {}, ["Tooltip is supplemental only and cannot be the sole carrier of essential action/status information."]),
  health_badge: contract("health_badge", "inform", "span", {}, ["Carries textual health state and diagnostic semantics in addition to color."]),
  freshness_badge: contract("freshness_badge", "inform", "span", {}, ["Carries observed-at or freshness semantics; stale state is explicit."]),
  confidence_indicator: contract("confidence_indicator", "inform", "span", {}, ["Carries confidence value or explicit unknown state."]),
  source_trust_label: contract("source_trust_label", "inform", "span", {}, ["Carries source and trust semantics, not presentation alone."]),
  stale_data_banner: contract("stale_data_banner", "inform", "article", {}, ["Links to remediation when a local remediation route exists."]),
  provider_state_panel: contract("provider_state_panel", "inform", "article", {}, ["Carries provider reachability, authorization and recovery semantics."]),
  missing_source_panel: contract("missing_source_panel", "inform", "article", {}, ["Identifies missing source truth and links to remediation when available."]),
  conflict_panel: contract("conflict_panel", "inform", "article", {}, ["Carries conflict evidence and audit/recovery references."]),
  approval_card: contract("approval_card", "activate", "article", {}, ["Approval actions retain authority checks and auditable state."]),
  obligation_card: contract("obligation_card", "navigate", "article", {}, ["Carries due/blocking semantics and a durable obligation reference."]),
  audit_row: contract("audit_row", "navigate", "article", {}, ["Carries audit identity and source semantics."]),
  reversible_action: contract("reversible_action", "reverse", "button", {}, ["Reversible actions expose reversal state and retain audit identity."]),
  destructive_confirm_dialog: contract("destructive_confirm_dialog", "confirm", "dialog", {}, ["Destructive actions require explicit confirmation before execution, including keyboard paths."]),
  offline_state: contract("offline_state", "inform", "article", {}, ["Offline presentation never implies business data is fresh."])
});

export function semanticComponentState(input: SemanticComponentState): SemanticComponentState {
  if (!input.state.trim() || !input.label.trim()) throw new Error("Semantic component state and label are required");
  for (const route of [input.remediationRoute]) if (route !== undefined && !route.startsWith("/")) throw new Error("Component remediation routes must be local");
  for (const ref of [input.sourceRef, input.auditRef, input.recoveryRef]) if (ref !== undefined && !ref.trim()) throw new Error("Component semantic references must be nonblank");
  if (input.observedAt !== undefined && !Number.isFinite(Date.parse(input.observedAt))) throw new Error("Component observedAt must be a valid timestamp");
  return Object.freeze({ ...input });
}

export interface InteractivePrimitiveInstance {
  readonly kind: PrimitiveKind;
  readonly width: number;
  readonly height: number;
  readonly accessibleName?: string;
  readonly colorOnlyState?: boolean;
  readonly decorativeChevron?: boolean;
}

export function assertPrimitiveAccessibility(instance: InteractivePrimitiveInstance): void {
  const primitive = COMMAND_CENTER_PRIMITIVES[instance.kind];
  if (!Number.isFinite(instance.width) || !Number.isFinite(instance.height) || instance.width < 0 || instance.height < 0) {
    throw new Error("Primitive dimensions must be non-negative finite numbers");
  }
  if (primitive.minimumTargetPx > 0 && (instance.width < primitive.minimumTargetPx || instance.height < primitive.minimumTargetPx)) {
    throw new Error(`${instance.kind} target must be at least ${primitive.minimumTargetPx}px in both dimensions`);
  }
  if (primitive.requiresAccessibleName && !instance.accessibleName?.trim()) throw new Error(`${instance.kind} requires an accessible name`);
  if (instance.colorOnlyState) throw new Error(`${instance.kind} cannot communicate state by color alone`);
  if (instance.decorativeChevron) throw new Error(`${instance.kind} cannot add decorative owner-facing chevrons`);
}

export interface ExpansionState {
  readonly expanded: boolean;
  readonly ariaExpanded: "true" | "false";
}

export function expansionState(expanded: boolean): ExpansionState {
  return Object.freeze({ expanded, ariaExpanded: expanded ? "true" : "false" });
}

export interface DialogInteractionState {
  readonly open: boolean;
  readonly focusContained: boolean;
  readonly returnFocusRequired: boolean;
  readonly escapeDismisses: boolean;
}

export function dialogInteractionState(open: boolean): DialogInteractionState {
  return Object.freeze({
    open,
    focusContained: open,
    returnFocusRequired: open,
    escapeDismisses: open
  });
}

export interface DestructiveConfirmationState {
  readonly actionRef: string;
  readonly confirmationRequired: true;
  readonly confirmed: boolean;
  readonly executable: boolean;
}

export function destructiveConfirmationState(actionRef: string, confirmed: boolean): DestructiveConfirmationState {
  if (!actionRef.trim()) throw new Error("Destructive action reference is required");
  return Object.freeze({ actionRef, confirmationRequired: true, confirmed, executable: confirmed });
}

export function assertTooltipSupplemental(essentialInformationOnlyInTooltip: boolean): void {
  if (essentialInformationOnlyInTooltip) throw new Error("Essential information cannot exist only in a tooltip");
}

export function sharedPrimitiveClass(kind: PrimitiveKind): string {
  switch (kind) {
    case "card": return "bevel-card";
    case "row": return "bevel-card";
    case "status_pill":
    case "health_badge":
    case "freshness_badge":
    case "confidence_indicator":
    case "source_trust_label": return "status";
    case "progress": return "progress-ring";
    case "expansion": return "navigation-toggle";
    case "dialog":
    case "destructive_confirm_dialog": return "cc-dialog";
    case "button":
    case "reversible_action": return "project-filter-button";
    case "loader": return "boot-state";
    case "empty_state":
    case "zero_state":
    case "error_state":
    case "stale_data_banner":
    case "provider_state_panel":
    case "missing_source_panel":
    case "conflict_panel":
    case "approval_card":
    case "obligation_card":
    case "audit_row":
    case "offline_state": return "empty-state";
    case "tooltip": return "cc-tooltip";
  }
}
