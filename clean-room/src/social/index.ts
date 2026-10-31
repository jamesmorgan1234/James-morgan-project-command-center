export * from "./identity.js";
export * from "./connections.js";
export * from "./drafts.js";
export * from "./profiles.js";
export * from "./publishing.js";
export * from "./protected-publishing.js";
export * from "./inbox.js";
export * from "./protected-communications.js";
export * from "./analytics.js";
export * from "./access.js";
export * from "./recovery.js";

export const P10_CURRENT_PHASES = Object.freeze([
  "P10.1 Entity, brand, platform, and account identity map",
  "P10.2 Connection, token, permission, and health management",
  "P10.3 Draft and content-asset system",
  "P10.4 Platform transformation and compliance profiles",
  "P10.5 Scheduling and publishing workflows",
  "P10.6 Inbox, community, and communication workflows",
  "P10.7 Social/content analytics and attribution",
  "P10.8 Cross-company isolation, paid actions, and recovery"
] as const);
