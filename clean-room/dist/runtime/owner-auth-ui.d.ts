import type { OwnerCredentialSubmit } from "./supabase-owner-provider.js";
export declare function promptForOwnerCredentials(submit: OwnerCredentialSubmit): Promise<void>;
export declare function installOwnerSignOutControl(signOut: () => Promise<void>): void;
