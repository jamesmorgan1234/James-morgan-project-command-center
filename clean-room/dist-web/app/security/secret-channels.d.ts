export type SecretRestrictedChannel = "client_bundle" | "log" | "brain_memory" | "url" | "note";
export declare function assertSecretChannelSafe(channel: SecretRestrictedChannel, payload: unknown): void;
export declare function redactSecretText(text: string): string;
