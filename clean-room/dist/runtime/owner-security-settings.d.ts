import type { SupabasePasskeyDescriptor } from "../security/supabase-passkeys.js";
export interface OwnerPasskeySettingsActions {
    listOwnerPasskeys(): Promise<readonly SupabasePasskeyDescriptor[]>;
    registerOwnerPasskey(): Promise<SupabasePasskeyDescriptor>;
    renameOwnerPasskey(passkeyId: string, friendlyName: string): Promise<SupabasePasskeyDescriptor>;
    removeOwnerPasskey(passkeyId: string): Promise<void>;
}
export declare function installOwnerPasskeySettings(actions: OwnerPasskeySettingsActions): void;
