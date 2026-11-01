import { type ReleaseIdentity, type UpdateState } from "../ui/pwa.js";
export interface PwaUpdateView {
    readonly state: UpdateState;
    readonly candidate: ReleaseIdentity | undefined;
    readonly registrationAvailable: boolean;
    readonly message: string;
}
type Listener = (view: PwaUpdateView) => void;
export declare class BrowserPwaUpdateClient {
    #private;
    get view(): PwaUpdateView;
    subscribe(listener: Listener): () => void;
    registerAndCheck(): Promise<void>;
    activateVerifiedUpdate(): Promise<boolean>;
}
export {};
