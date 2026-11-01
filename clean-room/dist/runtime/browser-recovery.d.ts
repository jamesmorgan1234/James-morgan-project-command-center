import { type RecoveryFailureCode } from "../kernel/recovery.js";
export declare function hasKnownGoodRelease(): Promise<boolean>;
export declare function restoreKnownGoodRelease(): Promise<boolean>;
export declare function markCurrentReleaseKnownGood(documentRef: Document): Promise<boolean>;
export declare function installBrowserRecoveryShell(node: HTMLElement, reason: RecoveryFailureCode): void;
