export interface ForkBundle {
  readonly codeRefs: readonly string[];
  readonly publicConfigRefs: readonly string[];
  readonly privateDataRefs: readonly string[];
  readonly secretRefs: readonly string[];
  readonly ownerPolicyRefs: readonly string[];
}

export function assertPublicForkSafe(bundle: ForkBundle): void {
  if (bundle.codeRefs.length === 0) throw new Error("fork requires code identity");
  if (bundle.privateDataRefs.length > 0 || bundle.secretRefs.length > 0 || bundle.ownerPolicyRefs.length > 0) throw new Error("public fork cannot clone private data, secrets, or owner-specific policy");
}
