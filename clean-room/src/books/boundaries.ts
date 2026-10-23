export interface BookExecutionPolicy {
  readonly projectId: string;
  readonly portfolioAgentAutoAllowed: boolean;
  readonly normalChatScope: readonly string[];
  readonly workScope: readonly string[];
}

export const DEFAULT_BOOK_EXECUTION_POLICY: BookExecutionPolicy = Object.freeze({
  projectId: "books",
  portfolioAgentAutoAllowed: false,
  normalChatScope: Object.freeze(["recovery", "writing", "editing", "artwork", "interior", "cover", "formatting", "qc", "package_creation"]),
  workScope: Object.freeze(["publishing_account_browser_upload", "previewer", "submission", "provider_account_bound_publishing"])
});

export function assertBookExecutionAllowed(policy: BookExecutionPolicy, action: string, executor: "portfolio_agent" | "normal_chat" | "work"): void {
  if (executor === "portfolio_agent" && !policy.portfolioAgentAutoAllowed) throw new Error("Books are excluded from portfolio Agent Auto");
  if (executor === "normal_chat" && !policy.normalChatScope.includes(action)) throw new Error("action is outside normal-chat Books scope");
  if (executor === "work" && !policy.workScope.includes(action)) throw new Error("Work is publishing-only for Books unless owner changes the rule");
}
