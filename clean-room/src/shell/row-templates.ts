/** Row templates, state templates, visual regression and safe areas. */

export interface RowTemplate {
  readonly kind: "project" | "active" | "next_up";
  readonly title: string;
  readonly meta: string;
}

function row(kind: RowTemplate["kind"], title: string, meta: string): RowTemplate {
  if (!title.trim()) throw new Error("A row requires a title");
  return Object.freeze({ kind, title, meta });
}

export function projectRow(title: string, status: string): RowTemplate {
  if (!status.trim()) throw new Error("A project row requires a status");
  return row("project", title, status);
}

export function activeRow(title: string, focus: string): RowTemplate {
  if (!focus.trim()) throw new Error("An active row requires a focus reason");
  return row("active", title, focus);
}

export function nextUpRow(title: string, rank: number): RowTemplate {
  if (!Number.isSafeInteger(rank) || rank < 1) throw new Error("A Next-Up row requires a positive rank");
  return row("next_up", title, `rank:${rank}`);
}

export function loadingStateTemplate(label: string, skeletons: number): string {
  if (!label.trim()) throw new Error("A loading state requires a label");
  if (!Number.isSafeInteger(skeletons) || skeletons < 1) throw new Error("A loading state requires skeleton rows");
  return `${label}:${skeletons}`;
}

export function emptyStateTemplate(message: string, action: string): string {
  if (!message.trim() || !action.trim()) throw new Error("An empty state requires a message and an action");
  return action;
}

export function errorStateTemplate(message: string, retryable: boolean): string {
  if (!message.trim()) throw new Error("An error state requires a message");
  return retryable ? "retry" : "contact";
}

export function visualRegressionSuite(screens: readonly string[]): readonly string[] {
  if (screens.length === 0) throw new Error("A visual regression suite requires screens");
  if (new Set(screens).size !== screens.length) throw new Error("Visual regression screens must be unique");
  return Object.freeze([...screens]);
}

export function safeAreaHandling(insets: { readonly top: number; readonly bottom: number }): void {
  if (insets.top < 0 || insets.bottom < 0) throw new Error("Safe-area insets must be nonnegative");
}
