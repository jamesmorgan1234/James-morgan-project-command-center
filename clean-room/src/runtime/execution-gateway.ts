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
