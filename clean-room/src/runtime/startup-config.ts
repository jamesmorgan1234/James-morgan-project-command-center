import {
  validateRuntimeStartupContract,
  type EnvironmentName,
  type RuntimeConfig,
  type TrustedEnvironmentDescriptor,
  type ValidatedRuntimeStartupContract
} from "../kernel/config.js";

function meta(documentRef: Document, name: string): string | undefined {
  const value = documentRef.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)?.content.trim();
  return value || undefined;
}

function requiredMeta(documentRef: Document, name: string): string {
  const value = meta(documentRef, name);
  if (!value) throw new Error(`Missing startup configuration: ${name}`);
  return value;
}

function positiveInteger(value: string, label: string): number {
  if (!/^\d+$/.test(value)) throw new Error(`Invalid startup configuration: ${label}`);
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) throw new Error(`Invalid startup configuration: ${label}`);
  return parsed;
}

function versionRange(value: string, label: string): Readonly<{ min: number; max: number }> {
  const match = /^(\d+)-(\d+)$/.exec(value);
  if (!match) throw new Error(`Invalid startup configuration: ${label}`);
  return Object.freeze({ min: positiveInteger(match[1]!, `${label}.min`), max: positiveInteger(match[2]!, `${label}.max`) });
}

function featureFlags(value: string | undefined): Readonly<Record<string, boolean>> {
  if (!value) return Object.freeze({});
  let parsed: unknown;
  try { parsed = JSON.parse(value); } catch { throw new Error("Invalid startup configuration: command-center-features"); }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Invalid startup configuration: command-center-features");
  return parsed as Readonly<Record<string, boolean>>;
}

function projectRefFromSupabaseUrl(rawUrl: string): { readonly origin: string; readonly projectRef: string } {
  let url: URL;
  try { url = new URL(rawUrl); } catch { throw new Error("Invalid startup configuration: command-center-supabase-url"); }
  if (url.protocol !== "https:" || !url.hostname.endsWith(".supabase.co")) throw new Error("Invalid startup configuration: command-center-supabase-url");
  const projectRef = url.hostname.slice(0, -".supabase.co".length).trim();
  if (!projectRef || projectRef.includes(".")) throw new Error("Invalid startup configuration: command-center-supabase-url");
  return Object.freeze({ origin: url.origin, projectRef });
}

export function readBrowserStartupConfiguration(documentRef: Document): ValidatedRuntimeStartupContract {
  const runtime: RuntimeConfig = {
    configVersion: positiveInteger(requiredMeta(documentRef, "command-center-config-version"), "command-center-config-version"),
    environment: requiredMeta(documentRef, "command-center-environment") as EnvironmentName,
    releaseId: requiredMeta(documentRef, "command-center-release"),
    schemaVersion: positiveInteger(requiredMeta(documentRef, "command-center-schema-version"), "command-center-schema-version"),
    apiVersion: positiveInteger(requiredMeta(documentRef, "command-center-api-version"), "command-center-api-version"),
    compatibleSchema: versionRange(requiredMeta(documentRef, "command-center-compatible-schema"), "command-center-compatible-schema"),
    compatibleApi: versionRange(requiredMeta(documentRef, "command-center-compatible-api"), "command-center-compatible-api"),
    features: featureFlags(meta(documentRef, "command-center-features"))
  };

  if (meta(documentRef, "command-center-runtime-endpoint")) return validateRuntimeStartupContract({ runtime });

  const supabaseUrl = meta(documentRef, "command-center-supabase-url");
  if (!supabaseUrl) return validateRuntimeStartupContract({ runtime });

  const backendEnvironment = requiredMeta(documentRef, "command-center-backend-environment") as EnvironmentName;
  const backend = projectRefFromSupabaseUrl(supabaseUrl);
  const trustedEnvironment: TrustedEnvironmentDescriptor = {
    environment: backendEnvironment,
    releaseId: runtime.releaseId,
    configurationDigest: requiredMeta(documentRef, "command-center-config-digest"),
    backend: {
      providerKey: "supabase",
      environment: backendEnvironment,
      baseUrl: backend.origin,
      projectRef: backend.projectRef,
      authIssuer: `${backend.origin}/auth/v1`,
      authAudience: "authenticated"
    }
  };
  return validateRuntimeStartupContract({ runtime, trustedEnvironment });
}

export function assertBrowserStartupConfiguration(documentRef: Document): ValidatedRuntimeStartupContract {
  return readBrowserStartupConfiguration(documentRef);
}
