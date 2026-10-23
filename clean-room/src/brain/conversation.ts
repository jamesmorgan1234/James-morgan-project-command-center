import type { BrainIntent } from "./core.js";

export interface ConversationTurn {
  readonly id: string;
  readonly ownerId: string;
  readonly projectId?: string;
  readonly role: "owner" | "brain" | "system";
  readonly text: string;
  readonly intent?: BrainIntent;
  readonly createdAt: string;
  readonly evidenceRefs: readonly string[];
}

export interface IntentClassification {
  readonly intent: BrainIntent;
  readonly protectedActionPossible: boolean;
}

const PROTECTED_PATTERNS = [/\bdeploy\b/i, /\bpublish\b/i, /\bsend\b/i, /\bbuy\b/i, /\bpurchase\b/i, /\bdelete\b/i, /\bmerge\b/i, /\bpassword\b/i, /\bsecurity\b/i];

export function classifyConversationIntent(text: string): IntentClassification {
  const protectedActionPossible = PROTECTED_PATTERNS.some((pattern) => pattern.test(text));
  if (protectedActionPossible) return Object.freeze({ intent: "protected_action_request", protectedActionPossible: true });
  if (/\b(go ahead|execute|start|build it|do it)\b/i.test(text)) return Object.freeze({ intent: "agent_request", protectedActionPossible: false });
  if (/\bidea\b/i.test(text)) return Object.freeze({ intent: "idea", protectedActionPossible: false });
  if (/\b(research|look up|investigate)\b/i.test(text)) return Object.freeze({ intent: "research", protectedActionPossible: false });
  if (/\?\s*$/.test(text.trim())) return Object.freeze({ intent: "question", protectedActionPossible: false });
  return Object.freeze({ intent: "owner_input", protectedActionPossible: false });
}
