/** Authenticated transport for actual execution. Acceptance alone is never a result. */
export interface ExecutionGatewayOptions {
  readonly supabaseUrl: string;
  readonly publishableKey: string;
  readonly accessToken: string;
  readonly fetcher: typeof fetch;
}

export async function invokeExecutionGateway(options: ExecutionGatewayOptions, request: Readonly<Record<string, unknown>>): Promise<Record<string, unknown>> {
  const response = await options.fetcher(`${options.supabaseUrl}/functions/v1/command-center-execution`, {
    method: "POST",
    headers: { apikey: options.publishableKey, authorization: `Bearer ${options.accessToken}`, "content-type": "application/json" },
    body: JSON.stringify(request),
    cache: "no-store",
    signal: AbortSignal.timeout(60_000)
  });
  const payload: unknown = await response.json();
  if (!response.ok) {
    const code = payload && typeof payload === "object" && "error" in payload ? String(payload.error) : "execution_unavailable";
    const messages: Record<string, string> = {
      no_eligible_executor: "No connected free execution worker is available. No draft was created and no work was reported as running.",
      no_eligible_inference: "Your message is saved, but no connected free Brain inference provider is available.",
      execution_not_verified: "The worker did not provide verifiable execution evidence. Execution is not confirmed.",
      response_not_verified: "The Brain provider did not save a verifiable response. Your message remains saved."
    };
    throw new Error(messages[code] ?? "Execution could not be confirmed. Check the saved state before retrying.");
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("Execution returned an invalid receipt");
  return payload as Record<string, unknown>;
}

export interface OwnerArtifactJobReceipt {
  readonly invocationId: string;
  readonly projectId: string;
  readonly companyId: string;
  readonly workerId: string;
  readonly state: "queued" | "claimed" | "completed" | "cancelled" | "uncertain";
  readonly executionVerified: boolean;
  readonly companyBuildStarted: false;
  readonly allowPaid: false;
  readonly commitId?: string;
  readonly outputText?: string;
  readonly outputHash?: string;
}

export interface OwnerArtifactJobRequest {
  readonly projectId: string;
  readonly invocationId: string;
  readonly workerId: string;
  readonly actionKey: "artifact.read" | "artifact.write";
  readonly input: { readonly name: string; readonly content?: string; };
}

/** Exact owner tool commands are separate from company Start and Brain chat. */
export async function requestOwnerArtifactJob(options: ExecutionGatewayOptions, request: OwnerArtifactJobRequest): Promise<OwnerArtifactJobReceipt> {
  const receipt = await invokeExecutionGateway(options, { ...request, action: "artifact_job_start", executionAuthorized: true, allowPaid: false, allowProtected: false });
  const verified = await verifyArtifactReceipt(receipt, request.projectId, request.invocationId);
  if (verified.workerId !== request.workerId) throw new Error("Artifact worker identity did not match the saved command");
  return verified;
}

export async function readOwnerArtifactJob(options: ExecutionGatewayOptions, projectId: string, invocationId: string): Promise<OwnerArtifactJobReceipt> {
  return verifyArtifactReceipt(await invokeExecutionGateway(options, { action: "artifact_job_status", projectId, invocationId }), projectId, invocationId);
}

export async function cancelOwnerArtifactJob(options: ExecutionGatewayOptions, projectId: string, invocationId: string): Promise<OwnerArtifactJobReceipt> {
  // A job that committed before cancellation remains completed, not cancelled.
  return verifyArtifactReceipt(await invokeExecutionGateway(options, { action: "artifact_job_cancel", projectId, invocationId }), projectId, invocationId);
}

async function verifyArtifactReceipt(r: Record<string, unknown>, projectId: string, invocationId: string): Promise<OwnerArtifactJobReceipt> {
  const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
  const companyId = projectId.startsWith("project:company:future:") ? projectId.slice(8) : `company:legacy:${projectId}`;
  if (r.projectId !== projectId || r.companyId !== companyId || r.invocationId !== invocationId ||
      !uuid.test(String(r.workerId ?? "")) || r.companyBuildStarted !== false || r.allowPaid !== false ||
      !["queued", "claimed", "completed", "cancelled", "uncertain"].includes(String(r.state))) throw new Error("Artifact job receipt identity is inconsistent");
  if (r.state === "completed") {
    if (r.executionVerified !== true || r.scope !== "exact_owner_artifact_job" || !uuid.test(String(r.commitId ?? "")) ||
        typeof r.outputText !== "string" || typeof r.outputHash !== "string" || !/^[a-f0-9]{64}$/.test(r.outputHash)) throw new Error("Artifact completion proof is missing");
    const actual = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(r.outputText))), b => b.toString(16).padStart(2, "0")).join("");
    if (actual !== r.outputHash) throw new Error("Artifact completion hash does not match saved output");
  } else if (r.executionVerified !== false) throw new Error("An unfinished artifact job cannot report execution");
  return r as unknown as OwnerArtifactJobReceipt;
}


/** Read a prepared company's source-verified starting packet without dispatching a worker.
 * This is an authenticated owner-only read. Company products and Brains are not started. */
export interface CompanyBuildPreparationReceipt {
  readonly projectId: string;
  readonly companyId: string;
  readonly companyStatus: "active";
  readonly preparationStatus: "source_verified_and_record_reconciled";
  readonly sourceAuthorityCommit: string;
  readonly roadmapVersion: number;
  readonly currentWorkUnitCount: number;
  readonly historicalWorkUnitCount: number;
  readonly brainKey: string;
  readonly brainRegistered: true;
  readonly brainEnabled: boolean;
  readonly brainExecutionVerified: false;
  readonly checkpointId: string;
  readonly resumeStateHash: string;
  readonly firstWorkUnitId: string;
  readonly firstWorkUnitTitle: string;
  readonly firstWorkUnitStatus: string;
  readonly blocker: string | null;
  readonly ownerAction: string | null;
  readonly reconciliationClaimId: string;
  readonly uninspectedOtherChats: boolean;
  readonly sourceRefs: readonly string[];
  readonly instructions: string;
  readonly instructionsSha256: string;
  readonly productBuilt: false;
  readonly liveWorkerExecutionVerified: false;
  readonly ownerAuthorizationForBuildRequired: true;
}

export async function loadCompanyBuildPreparation(
  options: ExecutionGatewayOptions,
  projectId: string
): Promise<CompanyBuildPreparationReceipt> {
  const match = /^project:company:future:(\d{3})$/.exec(projectId);
  const number = match ? Number(match[1]) : NaN;
  if (!match || !Number.isSafeInteger(number) || number < 1 || number > 117 || number === 14)
    throw new Error("Project is outside this 116-company preparation scope");
  const receipt = await invokeExecutionGateway(options, {action:"preparation_read", projectId});
  if (receipt.projectId !== projectId ||
      receipt.companyId !== `company:future:${match[1]}` ||
      receipt.companyStatus !== "active" ||
      receipt.preparationStatus !== "source_verified_and_record_reconciled" ||
      receipt.productBuilt !== false ||
      receipt.liveWorkerExecutionVerified !== false ||
      receipt.ownerAuthorizationForBuildRequired !== true ||
      typeof receipt.instructions !== "string" || receipt.instructions.length < 1000 ||
      typeof receipt.instructionsSha256 !== "string" || !/^[a-f0-9]{64}$/.test(receipt.instructionsSha256) ||
      typeof receipt.reconciliationClaimId !== "string" ||
      receipt.reconciliationClaimId !== `company-reconciliation:company:future:${match[1]}:v1`)
    throw new Error("The verified build-start receipt is incomplete or inconsistent");
  return receipt as unknown as CompanyBuildPreparationReceipt;
}
