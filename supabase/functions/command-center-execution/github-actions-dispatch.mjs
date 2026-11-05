/**
 * Opt-in transport proof for a future free GitHub-hosted worker.
 * NOT a project.execute worker and NOT a canonical task receipt.
 * Never register this proof transport as a healthy Agency executor.
 * The workflow must exist on the repository's default branch before
 * workflow_dispatch can start it through GitHub's REST API.
 */
const REPO = 'jamesmorgan1234/James-morgan-project-command-center';
const API = 'https://api.github.com/repos/' + REPO;
const WORKFLOW = 'cc-on-demand-runner-proof.yml';
const REF = 'build/cc-on-demand-no-schedule-isolated-20261105';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHA = /^[a-f0-9]{40}$/i;

export class GitHubDispatchUnavailable extends Error {
  constructor(code) { super(code); this.name = 'GitHubDispatchUnavailable'; }
}

const requireCondition = (ok, code) => {
  if (!ok) throw new GitHubDispatchUnavailable(code);
};

/**
 * Sends a non-project, non-billable source attestation probe only.
 * The result proves dispatch acceptance, never worker execution.
 * No Company ID, manuscript, owner bearer token, work objective,
 * canonical run, or project identifier is forwarded to GitHub.
 */
export async function requestGitHubRunnerProof({
  token, requestId, sourceSha, fetcher = fetch
}) {
  requireCondition(typeof token === 'string' && token.trim().length > 0,
    'github_dispatch_credential_not_configured');
  requireCondition(typeof requestId === 'string' && UUID.test(requestId),
    'github_dispatch_request_invalid');
  requireCondition(typeof sourceSha === 'string' && SHA.test(sourceSha),
    'github_dispatch_sha_invalid');
  requireCondition(typeof fetcher === 'function', 'github_dispatch_transport_invalid');

  // The server, not the browser, must own this credential. Never log it.
  const headers = {
    accept: 'application/vnd.github+json',
    authorization: 'Bearer ' + token,
    'x-github-api-version': '2022-11-28'
  };
  let metadata;
  try {
    const response = await fetcher(API, {
      method: 'GET', headers, redirect: 'error', cache: 'no-store'
    });
    requireCondition(response.ok, 'github_repository_check_failed');
    metadata = await response.json();
  } catch (error) {
    if (error instanceof GitHubDispatchUnavailable) throw error;
    throw new GitHubDispatchUnavailable('github_repository_check_failed');
  }
  requireCondition(metadata?.full_name === REPO && metadata?.private === false &&
    metadata?.visibility === 'public' && metadata?.archived !== true &&
    metadata?.disabled !== true, 'github_free_public_repository_not_verified');

  // This ONLY launches the constrained proof workflow on a standard runner.
  // It cannot mark the COMMAND CENTER Start button as operational.
  const path = API + '/actions/workflows/' + WORKFLOW + '/dispatches';
  const payload = {
    ref: REF,
    inputs: {request_id: requestId, source_sha: sourceSha.toLowerCase()}
  };
  let response;
  try {
    response = await fetcher(path, {
      method: 'POST',
      headers: {...headers, 'content-type': 'application/json'},
      redirect: 'error', cache: 'no-store', body: JSON.stringify(payload)
    });
  } catch {
    // A lost response is an uncertain side effect: do not auto-retry.
    throw new GitHubDispatchUnavailable('github_dispatch_outcome_unknown');
  }
  requireCondition(response.ok, 'github_dispatch_rejected');
  // 200 (newer API) can include an ID; 204 has no body.
  let receipt = null;
  if (response.status !== 204) {
    try { receipt = await response.json(); } catch { /* acceptance only */ }
  }
  const id = Number(receipt?.workflow_run_id);
  return Object.freeze({
    capability: 'repository.source_attestation',
    dispatchAccepted: true,
    executionVerified: false,
    projectExecutionVerified: false,
    scheduledFallback: false,
    repository: REPO, ref: REF,
    ...(Number.isSafeInteger(id) && id > 0 ? {workflowRunId: id} : {})
  });
}
