/**
 * COMMAND CENTER workstation inference adapter. No cloud-model fallback.
 * Ollama is accessed only through the loopback interface of the OWNER's PC.
 * This module never exposes a listener, shell command, owner token, or paid API.
 * A reachable Ollama API is NOT evidence of a capable model until it actually
 * generates a nonempty result from a real loaded local model.
 */
export class PcModelError extends Error {
  constructor(code) { super(code); this.name = 'PcModelError'; }
}
const requireState = (ok, code) => { if (!ok) throw new PcModelError(code); };
const localModelId = name => typeof name === 'string' && /^(?!.*:cloud$)[a-zA-Z0-9][a-zA-Z0-9._/-]{0,100}(?::[a-zA-Z0-9._-]{1,40})?$/.test(name) && !name.includes('..') && !name.includes('//');
const nonEmpty = (value, max) => typeof value === 'string' && value.trim().length > 0 && value.length <= max;
const ORIGIN = 'http://127.0.0.1:11434';
export function createPcLocalOllama({fetcher = fetch, modelId, timeoutMs = 120000} = {}) {
  requireState(typeof fetcher === 'function', 'local_fetcher_missing');
  requireState(localModelId(modelId), 'local_model_id_invalid_or_cloud');
  requireState(Number.isSafeInteger(timeoutMs) && timeoutMs >= 3000 && timeoutMs <= 600000, 'local_model_timeout_invalid');
  let verified = false, busy = false;
  async function localCall(path, init = {}) {
    const response = await fetcher(ORIGIN + path, {
      ...init, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(timeoutMs)
    });
    requireState(response?.ok === true, 'local_model_unreachable');
    return response.json();
  }
  async function verifyInstalledModel() {
    const payload = await localCall('/api/tags');
    requireState(Array.isArray(payload?.models), 'local_model_registry_invalid');
    requireState(payload.models.some(item => item?.name === modelId && item?.details !== null), 'local_model_not_installed');
    return true;
  }
  return Object.freeze({
    modelId,
    origin: ORIGIN,
    executionMode: 'pc-local-background',
    get readiness() { return Object.freeze({actualInferenceVerified: verified, requiresPoweredOnComputer: true, noCloudFallback: true, freeApiOnly: true}); },
    verifyInstalledModel,
    async generate({system, user} = {}) {
      requireState(nonEmpty(system, 12000) && nonEmpty(user, 12000), 'local_prompt_invalid');
      requireState(!busy, 'local_model_busy');
      busy = true;
      try {
        await verifyInstalledModel();
        const reply = await localCall('/api/chat', {
          method: 'POST', headers: {'content-type':'application/json'},
          body: JSON.stringify({model:modelId, messages:[{role:'system',content:system},{role:'user',content:user}], stream:false, options:{temperature:0.2,num_predict:1200}})
        });
        requireState(reply?.model === modelId && reply?.done === true && nonEmpty(reply?.message?.content, 8000), 'local_inference_not_verified');
        // A truncated output must not count as completed inference.
        requireState(!['length','max_tokens','unload'].includes(reply?.done_reason), 'local_inference_incomplete');
        verified = true;
        return Object.freeze({text:reply.message.content.trim(), modelId, verifiedInference:true, provenance:'pc-local-ollama', remoteInference:false, executionVerified:false});
      } finally { busy = false; }
    }
  });
}
