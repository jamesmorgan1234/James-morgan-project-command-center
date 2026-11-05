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
      no_verified_free_immediate_executor: "No verified free on-demand executor is connected for this project. Nothing was started, queued, or scheduled.",
      published_book_requires_separate_scope: "This project includes published material. Choose a specific unpublished manuscript before starting an editorial review.",
      project_hold_requires_owner_review: "This project is on hold. Review its existing blocker before requesting execution.",
      worker_claim_not_verified: "The executor did not provide a live worker claim; execution is not confirmed.",
      execution_task_not_persisted: "No durable task record was found for this start request; do not retry until its state is checked.",
      completion_evidence_not_verified: "A completed task has no independently verifiable result record.",
      no_eligible_inference: "Your message is saved, but no connected free Brain inference provider is available.",
      execution_not_verified: "The worker did not provide verifiable execution evidence. Execution is not confirmed.",
      response_not_verified: "The Brain provider did not save a verifiable response. Your message remains saved."
    };
    throw new Error(messages[code] ?? "Execution could not be confirmed. Check the saved state before retrying.");
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("Execution returned an invalid receipt");
  return payload as Record<string, unknown>;
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
