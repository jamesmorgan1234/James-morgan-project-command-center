export function inferBackendClassification(projectRef: any): "isolated" | "protected-production";
export function environmentIdentityPayload(binding: any): {
    deploymentEnvironment: any;
    backendClassification: any;
    providerKey: any;
    projectRef: any;
    baseUrl: any;
    authIssuer: any;
    authAudience: any;
};
export function validateTrustedEnvironmentBinding(binding: any): Readonly<{
    configDigest?: any;
    deploymentEnvironment: string;
    backendClassification: string;
    providerKey: string;
    projectRef: string;
    baseUrl: string;
    authIssuer: string;
    authAudience: string;
}>;
