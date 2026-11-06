import { authorizeBrainToolAction, discoverBrainTools, type BrainToolAction, type BrainToolDescriptor } from "./tool-access.js";

/** Resolved by COMMAND CENTER from its saved command, never from a model tool call. */
export interface SavedToolInvocation {
  readonly invocationId: string;
  readonly taskId: string;
  readonly workerId: string;
  readonly inputText: string;
  readonly action: BrainToolAction;
}

export interface ToolInvocationLease {
  readonly invocationId: string;
  readonly taskId: string;
  readonly workerId: string;
  readonly ownerId: string;
  readonly projectId: string;
  readonly companyId: string;
  readonly generation: number;
  readonly fencingToken: number;
  readonly expiresAt: string;
}

export interface ToolInvocationResult {
  readonly lease: ToolInvocationLease;
  readonly toolKey: string;
  readonly actionKey: string;
  readonly toolVersion: string;
  readonly inputHash: string;
  readonly outputText: string;
  readonly outputHash: string;
}

export interface BrainToolRuntimeAdapters {
  /** Must enforce canonical owner/project/account membership and saved authority. */
  readonly resolve: (invocationId: string) => Promise<SavedToolInvocation>;
  readonly catalog: () => Promise<readonly BrainToolDescriptor[]>;
  /** Atomic: persists a start before invoking; an uncertain prior start cannot be fresh. */
  readonly begin: (invocation: SavedToolInvocation, inputHash: string) => Promise<
    { readonly state: "fresh"; readonly lease: ToolInvocationLease } |
    { readonly state: "completed"; readonly result: ToolInvocationResult } |
    { readonly state: "uncertain" }
  >;
  /** Rechecks run Stop/Pause, generation, fence, lease, identity, and revocation. */
  readonly assertCurrent: (lease: ToolInvocationLease) => Promise<void>;
  /** Atomically rechecks the lease/Stop/Pause before saving an immutable result. */
  readonly commit: (result: ToolInvocationResult) => Promise<void>;
  readonly readBack: (invocationId: string) => Promise<ToolInvocationResult>;
  readonly now: () => string;
  readonly sha256: (text: string) => Promise<string>;
}

export interface BoundBrainToolHandler {
  readonly toolKey: string;
  readonly actionKey: string;
  readonly versionRef: string;
  /** The handler must confine actual resources to this trusted action/account. */
  readonly invoke: (input: { readonly inputText: string; readonly action: BrainToolAction; readonly signal: AbortSignal }) => Promise<string>;
}

const HASH = /^[a-f0-9]{64}$/;
const requireValue = (condition: unknown, code: string): void => { if (!condition) throw new Error(code); };
const nonblank = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
const resultIdentity = (r: ToolInvocationResult): string => JSON.stringify([
  r.lease.invocationId, r.lease.taskId, r.lease.workerId, r.lease.ownerId, r.lease.projectId, r.lease.companyId,
  r.lease.generation, r.lease.fencingToken, r.lease.expiresAt, r.toolKey, r.actionKey, r.toolVersion, r.inputHash, r.outputText, r.outputHash
]);

/**
 * Executes already-authorized tool work with durable start/result adapters.
 * Does not export session tools, install a worker, grant permissions, start a
 * company run, or treat a registered descriptor as an executable handler.
 */
export function createBrainToolRuntime(adapters: BrainToolRuntimeAdapters, handlers: readonly BoundBrainToolHandler[]) {
  const bindings = new Map<string, BoundBrainToolHandler>();
  for (const h of handlers) {
    requireValue(nonblank(h.toolKey) && nonblank(h.actionKey) && nonblank(h.versionRef) && typeof h.invoke === "function", "invalid_tool_handler");
    const key = JSON.stringify([h.toolKey, h.actionKey]);
    requireValue(!bindings.has(key), "ambiguous_tool_handler");
    bindings.set(key, Object.freeze({ ...h }));
  }
  const pending = new Set<string>();
  const hash = async (s: string): Promise<string> => {
    const value = await adapters.sha256(s);
    requireValue(HASH.test(value), "invalid_runtime_hash");
    return value;
  };
  const verifyLease = (lease: ToolInvocationLease, saved: SavedToolInvocation): void => {
    requireValue(lease.invocationId === saved.invocationId && lease.taskId === saved.taskId && lease.workerId === saved.workerId &&
      lease.ownerId === saved.action.ownerId && lease.projectId === saved.action.projectId && lease.companyId === saved.action.companyId &&
      Number.isSafeInteger(lease.generation) && lease.generation >= 1 && Number.isSafeInteger(lease.fencingToken) && lease.fencingToken >= 1,
    "tool_lease_identity_mismatch");
    const current = Date.parse(adapters.now());
    requireValue(Number.isFinite(current) && Number.isFinite(Date.parse(lease.expiresAt)) && Date.parse(lease.expiresAt) > current, "tool_lease_expired");
  };
  const verifyResult = async (result: ToolInvocationResult, saved: SavedToolInvocation, inputHash: string, version: string): Promise<void> => {
    // Historical completed results may have expired leases, but their complete
    // identity, fence and immutable contents must still match the saved command.
    const l = result.lease;
    requireValue(l.invocationId === saved.invocationId && l.taskId === saved.taskId && l.workerId === saved.workerId &&
      l.ownerId === saved.action.ownerId && l.projectId === saved.action.projectId && l.companyId === saved.action.companyId &&
      Number.isSafeInteger(l.generation) && l.generation >= 1 && Number.isSafeInteger(l.fencingToken) && l.fencingToken >= 1 &&
      Number.isFinite(Date.parse(l.expiresAt)) && result.toolKey === saved.action.toolKey && result.actionKey === saved.action.actionKey &&
      result.toolVersion === version && result.inputHash === inputHash && typeof result.outputText === "string" && result.outputText.length <= 1000000 &&
      HASH.test(result.outputHash) && await hash(result.outputText) === result.outputHash, "tool_result_readback_mismatch");
  };
  return Object.freeze({
    async execute(invocationId: string): Promise<ToolInvocationResult> {
      requireValue(nonblank(invocationId) && invocationId.length <= 240, "invalid_invocation_id");
      requireValue(!pending.has(invocationId), "tool_invocation_busy");
      pending.add(invocationId);
      try {
        // Structured cloning prevents a caller/handler mutating authority while
        // an awaited catalog, lease check, or tool invocation is in progress.
        const saved = structuredClone(await adapters.resolve(invocationId));
        requireValue(saved.invocationId === invocationId && nonblank(saved.taskId) && nonblank(saved.workerId) &&
          typeof saved.inputText === "string" && saved.inputText.length <= 1000000, "saved_invocation_invalid");
        const catalog = discoverBrainTools(await adapters.catalog());
        const action = { ...saved.action, now: adapters.now() };
        const verdict = authorizeBrainToolAction(catalog, action);
        requireValue(verdict.allowed, verdict.reason);
        const tool = catalog.find(t => t.key === action.toolKey)!;
        const handler = bindings.get(JSON.stringify([action.toolKey, action.actionKey]));
        requireValue(handler && handler.versionRef === tool.versionRef, "callable_tool_handler_missing_or_version_mismatch");
        const inputHash = await hash(saved.inputText);
        const start = await adapters.begin(structuredClone(saved), inputHash);
        if (start.state === "uncertain") throw new Error("prior_tool_effect_requires_reconciliation");
        if (start.state === "completed") {
          await verifyResult(start.result, saved, inputHash, tool.versionRef);
          const persisted = await adapters.readBack(invocationId);
          await verifyResult(persisted, saved, inputHash, tool.versionRef);
          requireValue(resultIdentity(persisted) === resultIdentity(start.result), "tool_result_changed_after_commit");
          return structuredClone(persisted);
        }
        const lease = structuredClone(start.lease);
        verifyLease(lease, saved);
        await adapters.assertCurrent(structuredClone(lease));
        // Time may pass in the durable current-claim check. Recheck authority,
        // health, and lease immediately before the actual effect.
        verifyLease(lease, saved);
        const latest = discoverBrainTools(await adapters.catalog());
        const renewed = authorizeBrainToolAction(latest, { ...saved.action, now: adapters.now() });
        requireValue(renewed.allowed, renewed.reason);
        requireValue(latest.find(t => t.key === action.toolKey)?.versionRef === tool.versionRef, "tool_version_changed_before_invocation");
        verifyLease(lease, saved);
        const timeout = Math.min(Date.parse(lease.expiresAt), Date.parse(saved.action.authority.expiresAt)) - Date.parse(adapters.now());
        requireValue(timeout > 0 && timeout <= 2147483647, "tool_deadline_invalid");
        const cancellation = new AbortController();
        const deadline = AbortSignal.timeout(timeout);
        const signal = AbortSignal.any([cancellation.signal, deadline]);
        let checking = false;
        const watcher = setInterval(async () => {
          if (checking || signal.aborted) return;
          checking = true;
          try { await adapters.assertCurrent(structuredClone(lease)); }
          catch { cancellation.abort(new Error("tool_claim_revoked_during_invocation")); }
          finally { checking = false; }
        }, 1000);
        let outputText: string;
        let removeAbortListener = (): void => {};
        try {
          const aborted = new Promise<never>((_, reject) => {
            const rejectAbort = (): void => reject(new Error("tool_invocation_cancelled_or_expired"));
            signal.addEventListener("abort", rejectAbort, { once: true });
            removeAbortListener = () => signal.removeEventListener("abort", rejectAbort);
          });
          outputText = await Promise.race([
            handler!.invoke({ inputText: saved.inputText, action: structuredClone(saved.action), signal }), aborted
          ]);
          requireValue(!signal.aborted, "tool_invocation_deadline_exceeded");
        } finally { clearInterval(watcher); removeAbortListener(); }
        requireValue(typeof outputText === "string" && outputText.length <= 1000000, "invalid_tool_output");
        const result: ToolInvocationResult = { lease, toolKey: action.toolKey, actionKey: action.actionKey, toolVersion: tool.versionRef,
          inputHash, outputText, outputHash: await hash(outputText) };
        verifyLease(lease, saved);
        await adapters.assertCurrent(structuredClone(lease));
        await adapters.commit(structuredClone(result));
        const persisted = await adapters.readBack(invocationId);
        await verifyResult(persisted, saved, inputHash, tool.versionRef);
        requireValue(resultIdentity(persisted) === resultIdentity(result), "tool_result_changed_after_commit");
        return structuredClone(persisted);
      } finally { pending.delete(invocationId); }
    }
  });
}
