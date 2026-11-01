/**
 * Extensible registries and registration templates.
 *
 * One versioned registry shape owns discovery for tools, security actions,
 * deployment targets and voice providers. Each registry enforces its own contract
 * before an entry can be discovered, and the template factories define what a new
 * project type or agent capability must declare.
 */
export class TypedRegistry {
    #items = new Map();
    #validate;
    constructor(validate) {
        this.#validate = validate;
    }
    register(item) {
        this.#validate(item);
        if (!Number.isSafeInteger(item.version) || item.version < 1)
            throw new Error(`Registry version must be a positive safe integer for ${item.key}`);
        if (this.#items.has(item.key))
            throw new Error(`Registry key already exists: ${item.key}`);
        const stored = Object.freeze({ ...item });
        this.#items.set(item.key, stored);
        return stored;
    }
    get(key) { return this.#items.get(key); }
    list() { return Object.freeze([...this.#items.values()]); }
    get size() { return this.#items.size; }
}
export class ToolRegistry extends TypedRegistry {
    constructor() {
        super((tool) => {
            if (tool.capabilityKeys.length === 0 || tool.capabilityKeys.some((key) => !key.trim()))
                throw new Error("Tool requires a declared capability");
            if (!["low", "medium", "high", "protected"].includes(tool.risk))
                throw new Error("Tool requires a supported risk class");
        });
    }
}
export class SecurityActionRegistry extends TypedRegistry {
    constructor() {
        super((action) => {
            if (action.protectedAction && !action.requiresApproval)
                throw new Error("Protected security actions require approval");
        });
    }
}
export class DeploymentTargetRegistry extends TypedRegistry {
    constructor() {
        super((target) => {
            if (!["development", "preview", "production"].includes(target.environment))
                throw new Error("Deployment target requires a supported environment");
            if (target.environment === "production" && !target.productionAuthorizationRequired)
                throw new Error("Production targets require explicit authorization");
        });
    }
}
export class VoiceProviderRegistry extends TypedRegistry {
    constructor() {
        super((provider) => {
            if (!["granted", "denied", "prompt"].includes(provider.permission))
                throw new Error("Voice provider requires a supported permission state");
        });
    }
}
export function projectTypeTemplate(input) {
    if (!input.key.trim())
        throw new Error("Project type template requires a key");
    if (input.requiredSections.length === 0 || input.requiredSections.some((section) => !section.trim()))
        throw new Error("Project type template requires declared sections");
    if (input.capabilityKeys.length === 0 || input.capabilityKeys.some((key) => !key.trim()))
        throw new Error("Project type template requires declared capabilities");
    return Object.freeze({
        key: input.key,
        version: 1,
        requiredSections: Object.freeze([...input.requiredSections]),
        capabilityKeys: Object.freeze([...input.capabilityKeys])
    });
}
export function agentCapabilityTemplate(input) {
    if (!input.key.trim())
        throw new Error("Agent capability template requires a key");
    if (input.capabilityKeys.length === 0 || input.capabilityKeys.some((key) => !key.trim()))
        throw new Error("Agent capability template requires declared capabilities");
    if (!["low", "medium", "high", "protected"].includes(input.risk))
        throw new Error("Agent capability template requires a supported risk class");
    return Object.freeze({
        key: input.key,
        version: 1,
        capabilityKeys: Object.freeze([...input.capabilityKeys]),
        risk: input.risk
    });
}
//# sourceMappingURL=registries.js.map