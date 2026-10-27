import type { BookFormat } from "./registry.js";
import type { PublishingProviderHealth, PublishingAdapterBoundary } from "./providers.js";

export type PublishingConnectionState = "disconnected" | "connected" | "owner_action_required" | "unavailable";
export interface PublishingProviderCapabilities { readonly upload:boolean; readonly submit:boolean; readonly retrievePublicationState:boolean; readonly receipts:boolean; }
export interface PublishingProviderConnection {
 readonly key:string; readonly ownerId:string; readonly version:number; readonly health:PublishingProviderHealth; readonly connectionState:PublishingConnectionState; readonly credentialRef?:string|undefined; readonly formats:readonly BookFormat[]; readonly capabilities:PublishingProviderCapabilities; readonly executionBoundary:PublishingAdapterBoundary; readonly ownerActionRequired:boolean; readonly evidenceRefs:readonly string[]; readonly receiptRefs:readonly string[]; readonly errorRefs:readonly string[]; readonly replacesProviderKey?:string|undefined; readonly migrationRef?:string|undefined; readonly observedAt:string;
}
function clean(values:readonly string[],label:string,required=false):readonly string[]{if(!Array.isArray(values)||(required&&values.length===0)||values.some(v=>typeof v!=="string"||!v.trim()))throw new Error(`${label} must contain nonblank references`);const n=values.map(v=>v.trim());if(new Set(n).size!==n.length)throw new Error(`${label} cannot contain duplicates`);return Object.freeze(n);}
export function validatePublishingProviderConnection(value:PublishingProviderConnection):PublishingProviderConnection{
 if(!value.key.trim()||!value.ownerId.trim()||!Number.isSafeInteger(value.version)||value.version<1||!Number.isFinite(Date.parse(value.observedAt)))throw new Error("publishing provider connection identity/version/time required");
 const formats=clean(value.formats,"publishing provider formats",true) as readonly BookFormat[]; const evidenceRefs=clean(value.evidenceRefs,"publishing provider evidence",true),receiptRefs=clean(value.receiptRefs,"publishing provider receipts"),errorRefs=clean(value.errorRefs,"publishing provider errors");
 if(value.connectionState==="connected"&&!value.credentialRef?.trim())throw new Error("connected publishing provider requires credential reference");
 if(value.connectionState!=="connected"&&value.credentialRef!==undefined&&!value.credentialRef.trim())throw new Error("credential reference must be nonblank when present");
 if(value.connectionState==="owner_action_required"&&!value.ownerActionRequired)throw new Error("owner-action connection state requires owner action boundary");
 if(value.ownerActionRequired&&value.executionBoundary==="normal_chat")throw new Error("owner-required provider action cannot execute in normal chat");
 if(value.connectionState==="unavailable"&&value.health!=="unavailable")throw new Error("unavailable connection must report unavailable health");
 if(value.replacesProviderKey!==undefined&&!value.replacesProviderKey.trim())throw new Error("replacement provider key must be nonblank");
 if(value.replacesProviderKey&&!value.migrationRef?.trim())throw new Error("provider replacement requires migration lineage");
 return Object.freeze({...value,formats,evidenceRefs,receiptRefs,errorRefs,capabilities:Object.freeze({...value.capabilities})});
}
export function providerCanUpload(value:PublishingProviderConnection,format:BookFormat):boolean{const v=validatePublishingProviderConnection(value);return v.connectionState==="connected"&&v.health!=="unavailable"&&v.capabilities.upload&&v.formats.includes(format);}
