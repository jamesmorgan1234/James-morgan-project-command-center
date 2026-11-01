export interface ForkBundle {
    readonly codeRefs: readonly string[];
    readonly publicConfigRefs: readonly string[];
    readonly privateDataRefs: readonly string[];
    readonly secretRefs: readonly string[];
    readonly ownerPolicyRefs: readonly string[];
}
export declare function assertPublicForkSafe(bundle: ForkBundle): void;
export interface SyntheticForkEntry {
    readonly ref: string;
    readonly kind: 'code' | 'config' | 'data' | 'policy' | 'credential';
    readonly classification: 'public' | 'private' | 'owner_policy' | 'credential';
    readonly contentDigest: string;
}
export declare function prepareDormantPublicFork(entries: readonly SyntheticForkEntry[], expectedSourceDigest: string): Promise<{
    bundle: {
        codeRefs: string[];
        publicConfigRefs: string[];
        privateDataRefs: never[];
        secretRefs: never[];
        ownerPolicyRefs: never[];
    };
    selectedDigests: {
        ref: string;
        digest: string;
    }[];
    sourceDigest: string;
    forkDigest: string;
    status: "dormant";
    mayPublish: false;
    mayClonePrivateState: false;
}>;
