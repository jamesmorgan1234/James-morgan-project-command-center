import { HomeModuleRegistry, type HomeModuleGridContract, type HomeModuleRegistration } from "../ui/home.js";
import type { CommandCenterRuntimeSnapshot } from "./snapshot.js";
export interface HomeRuntimeContext {
    readonly snapshot: CommandCenterRuntimeSnapshot;
    readonly activeCount: number;
    readonly nextCount: number;
}
export declare function createCoreHomeModuleRegistry(extensions?: readonly HomeModuleRegistration<HomeRuntimeContext>[]): HomeModuleRegistry<HomeRuntimeContext>;
export declare function buildHomeModuleGrid(context: HomeRuntimeContext, extensions?: readonly HomeModuleRegistration<HomeRuntimeContext>[]): HomeModuleGridContract;
