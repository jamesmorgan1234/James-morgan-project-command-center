import type { RuntimeSnapshotProvider } from "./provider.js";
import type { CommandCenterRuntimeSnapshot } from "./snapshot.js";
export declare function renderBrainView(snapshot: CommandCenterRuntimeSnapshot, provider: RuntimeSnapshotProvider | undefined, rerender: () => Promise<void>): HTMLElement;
