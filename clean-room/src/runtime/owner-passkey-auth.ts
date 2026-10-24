import { SupabasePasskeyClient, SupabasePasskeyError, type PasskeyCredentialApi } from "../security/supabase-passkeys.js";

export interface OwnerPasskeyAuthOptions {
  readonly documentRef: Document;
  readonly fetcher?: typeof fetch;
  readonly credentials?: PasskeyCredentialApi;
}

export interface OwnerPasskeyAvailability {
  readonly supported: boolean;
  readonly reason?: "secure_broker_unavailable" | "webauthn_unavailable" | "configuration_missing";
}

function meta(documentRef: Document, name: string): string | undefined {
  const value = documentRef.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)?.content.trim();
  return value || undefined;
}

function pageUrl(documentRef: Document): URL | undefined {
  try { return new URL(documentRef.baseURI); }
  catch { return undefined; }
}

function hasWebAuthn(credentials?: PasskeyCredentialApi): boolean {
  if (credentials) return true;
  return typeof navigator !== "undefined" && !!navigator.credentials && typeof PublicKeyCredential !== "undefined";
}

export function ownerPasskeyAvailability(documentRef: Document, credentials?: PasskeyCredentialApi): OwnerPasskeyAvailability {
  const page = pageUrl(documentRef);
  const supabaseUrl = meta(documentRef, "command-center-supabase-url");
  const publishableKey = meta(documentRef, "command-center-supabase-publishable-key");
  if (!supabaseUrl || !publishableKey) return Object.freeze({ supported: false, reason: "configuration_missing" });
  if (!page || page.protocol !== "https:" || !page.hostname.endsWith(".vercel.app")) {
    return Object.freeze({ supported: false, reason: "secure_broker_unavailable" });
  }
  if (!hasWebAuthn(credentials)) return Object.freeze({ supported: false, reason: "webauthn_unavailable" });
  return Object.freeze({ supported: true });
}

export async function establishOwnerPasskeySession(options: OwnerPasskeyAuthOptions): Promise<void> {
  const availability = ownerPasskeyAvailability(options.documentRef, options.credentials);
  if (!availability.supported) {
    throw new SupabasePasskeyError(
      availability.reason === "webauthn_unavailable"
        ? "This browser does not support passkey sign-in"
        : "Secure passkey sign-in is unavailable on this origin",
      availability.reason ?? "passkey_unavailable"
    );
  }

  const page = pageUrl(options.documentRef) as URL;
  const publishableKey = meta(options.documentRef, "command-center-supabase-publishable-key") as string;
  const fetcher = options.fetcher ?? fetch;
  const passkeys = new SupabasePasskeyClient({
    authBaseUrl: new URL("/__cc_auth__", page).toString().replace(/\/$/u, ""),
    publishableKey,
    fetcher,
    ...(options.credentials ? { credentials: options.credentials } : {})
  });

  const signedIn = await passkeys.signIn({ mediation: "required" });
  const response = await fetcher(new URL("/api/owner-session", page), {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "x-cc-supabase-key": publishableKey
    },
    body: JSON.stringify({ action: "establish", refreshToken: signedIn.session.refreshToken }),
    credentials: "same-origin",
    cache: "no-store"
  });
  if (!response.ok) throw new SupabasePasskeyError("Secure owner session could not be established after passkey verification", "secure_session_broker_failed", response.status);
}
