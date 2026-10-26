const ENVIRONMENTS = new Set(["development", "test", "preview", "staging", "production"]);
const BACKEND_CLASSIFICATIONS = new Set(["isolated", "shared-nonproduction", "protected-production"]);
const PROTECTED_PROJECT_REFS = new Set(["gmlsucpwliegwlxymjvp"]);

export function inferBackendClassification(projectRef) {
  if (PROTECTED_PROJECT_REFS.has(String(projectRef ?? "").trim())) return "protected-production";
  return "isolated";
}

export function environmentIdentityPayload(binding) {
  return {
    deploymentEnvironment: binding.deploymentEnvironment,
    backendClassification: binding.backendClassification,
    providerKey: binding.providerKey,
    projectRef: binding.projectRef,
    baseUrl: binding.baseUrl,
    authIssuer: binding.authIssuer,
    authAudience: binding.authAudience
  };
}

export function validateTrustedEnvironmentBinding(binding) {
  if (!binding || typeof binding !== "object") throw new Error("trusted_environment_binding_required");
  const deploymentEnvironment = String(binding.deploymentEnvironment ?? "").trim();
  const backendClassification = String(binding.backendClassification ?? "").trim();
  const providerKey = String(binding.providerKey ?? "").trim();
  const projectRef = String(binding.projectRef ?? "").trim();
  const authAudience = String(binding.authAudience ?? "").trim();
  const configDigest = typeof binding.configDigest === "string" ? binding.configDigest.trim() : "";

  if (!ENVIRONMENTS.has(deploymentEnvironment)) throw new Error("invalid_environment_configuration");
  if (!BACKEND_CLASSIFICATIONS.has(backendClassification)) throw new Error("invalid_backend_classification");
  if (!providerKey || !projectRef || !authAudience) throw new Error("trusted_backend_identity_incomplete");

  let baseUrl;
  let authIssuer;
  try {
    baseUrl = new URL(binding.baseUrl);
    authIssuer = new URL(binding.authIssuer);
  } catch {
    throw new Error("trusted_backend_url_invalid");
  }
  if (baseUrl.protocol !== "https:" || authIssuer.protocol !== "https:") throw new Error("trusted_backend_https_required");
  if (authIssuer.origin !== baseUrl.origin) throw new Error("auth_issuer_backend_mismatch");

  if (providerKey === "supabase" && baseUrl.hostname.endsWith(".supabase.co") && baseUrl.hostname !== `${projectRef}.supabase.co`) {
    throw new Error("identity_provider_project_mismatch");
  }

  const inferred = inferBackendClassification(projectRef);
  if (inferred === "protected-production" && backendClassification !== "protected-production") {
    throw new Error("protected_backend_misclassified");
  }
  if (backendClassification === "protected-production" && deploymentEnvironment !== "production") {
    throw new Error("protected_production_backend_forbidden_outside_production");
  }
  if (deploymentEnvironment === "production" && backendClassification === "shared-nonproduction") {
    throw new Error("nonproduction_backend_forbidden_in_production");
  }

  return Object.freeze({
    deploymentEnvironment,
    backendClassification,
    providerKey,
    projectRef,
    baseUrl: baseUrl.origin,
    authIssuer: authIssuer.toString().replace(/\/$/, ""),
    authAudience,
    ...(configDigest ? { configDigest } : {})
  });
}
