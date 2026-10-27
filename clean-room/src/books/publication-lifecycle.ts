import type { BookFormat } from "./registry.js";

export type PublicationLifecycleState = "not_prepared" | "prepared" | "upload_ready" | "uploaded" | "draft" | "submitted" | "in_review" | "changes_required" | "blocked" | "rejected" | "approved" | "live" | "unpublished" | "archived" | "superseded";

export interface BookPublicationLifecycleEvent {
  readonly id: string;
  readonly ownerId: string;
  readonly projectId: string;
  readonly bookId: string;
  readonly edition: string;
  readonly format: BookFormat;
  readonly providerKey: string;
  readonly providerListingId?: string | undefined;
  readonly state: PublicationLifecycleState;
  readonly providerReceiptRef?: string | undefined;
  readonly providerPublicationRef?: string | undefined;
  readonly providerTimestamp?: string | undefined;
  readonly errorRefs: readonly string[];
  readonly correctionRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly uncertainty?: string | undefined;
  readonly supersedesEventId?: string | undefined;
  readonly observedAt: string;
  readonly lastVerifiedAt: string;
}

const TRANSITIONS: Readonly<Record<PublicationLifecycleState, readonly PublicationLifecycleState[]>> = {
  not_prepared:["prepared","archived"], prepared:["upload_ready","archived"], upload_ready:["uploaded","blocked","archived"], uploaded:["draft","submitted","blocked"], draft:["submitted","blocked","archived"], submitted:["in_review","changes_required","blocked","rejected"], in_review:["changes_required","blocked","rejected","approved"], changes_required:["upload_ready","uploaded","draft","submitted","blocked","rejected"], blocked:["upload_ready","uploaded","draft","submitted","in_review","archived"], rejected:["upload_ready","archived"], approved:["live","blocked","archived"], live:["unpublished","superseded"], unpublished:["live","archived","superseded"], archived:[], superseded:[]
};

function time(value:string,label:string):number { const parsed=Date.parse(value); if(!Number.isFinite(parsed)) throw new Error(`${label} must be an ISO-compatible timestamp`); return parsed; }
function refs(values:readonly string[],label:string,required=false):readonly string[]{ if(!Array.isArray(values)||(required&&values.length===0)||values.some(v=>typeof v!=="string"||!v.trim())) throw new Error(`${label} must contain nonblank references`); const normalized=values.map(v=>v.trim()); if(new Set(normalized).size!==normalized.length) throw new Error(`${label} cannot contain duplicates`); return Object.freeze(normalized); }

export function validatePublicationLifecycleEvent(event:BookPublicationLifecycleEvent):BookPublicationLifecycleEvent {
  if(!event.id.trim()||!event.ownerId.trim()||!event.projectId.trim()||!event.bookId.trim()||!event.edition.trim()||!event.providerKey.trim()) throw new Error("publication lifecycle exact identity is required");
  const observed=time(event.observedAt,"publication observedAt"), verified=time(event.lastVerifiedAt,"publication lastVerifiedAt"); if(verified>observed) throw new Error("publication verification cannot occur after observation");
  const evidenceRefs=refs(event.evidenceRefs,"publication evidence",event.state!=="not_prepared"); const errorRefs=refs(event.errorRefs,"publication errors"); const correctionRefs=refs(event.correctionRefs,"publication corrections");
  if(["submitted","in_review","changes_required","rejected","approved","live","unpublished","superseded"].includes(event.state)&&!event.providerReceiptRef?.trim()) throw new Error("provider receipt is required for provider-confirmed publication states");
  if(["in_review","changes_required","rejected","approved","live","unpublished","superseded"].includes(event.state)&&!event.providerListingId?.trim()) throw new Error("provider listing identity is required for provider review/publication states");
  if(event.state==="live"&&(!event.providerPublicationRef?.trim()||!event.providerTimestamp)) throw new Error("live publication requires provider publication reference and provider timestamp");
  if(event.providerTimestamp&&time(event.providerTimestamp,"provider timestamp")>observed) throw new Error("provider timestamp cannot occur after observation");
  if((event.state==="blocked"||event.state==="changes_required"||event.state==="rejected")&&errorRefs.length===0&&correctionRefs.length===0) throw new Error("blocked/change/rejected publication state requires error or correction evidence");
  return Object.freeze({...event,evidenceRefs,errorRefs,correctionRefs});
}

function key(event:Pick<BookPublicationLifecycleEvent,"ownerId"|"projectId"|"bookId"|"edition"|"format"|"providerKey">):string { return `${event.ownerId}:${event.projectId}:${event.bookId}:${event.edition}:${event.format}:${event.providerKey}`; }

export class BookPublicationLifecycleLedger {
  readonly #current=new Map<string,BookPublicationLifecycleEvent>(); readonly #history:BookPublicationLifecycleEvent[]=[];
  record(event:BookPublicationLifecycleEvent):BookPublicationLifecycleEvent { const valid=validatePublicationLifecycleEvent(event), k=key(valid), prior=this.#current.get(k); if(prior){ if(valid.supersedesEventId!==prior.id) throw new Error("publication lifecycle event must supersede exact current event"); if(time(valid.observedAt,"publication observedAt")<=time(prior.observedAt,"prior publication observedAt")) throw new Error("publication lifecycle observation must advance"); if(!TRANSITIONS[prior.state].includes(valid.state)) throw new Error(`invalid publication lifecycle transition ${prior.state} -> ${valid.state}`); if(prior.providerListingId&&valid.providerListingId&&prior.providerListingId!==valid.providerListingId&&valid.state!=="superseded") throw new Error("provider listing identity cannot be silently substituted"); } else { if(valid.supersedesEventId!==undefined||valid.state!=="not_prepared") throw new Error("publication lifecycle must begin at not_prepared without supersession"); } this.#current.set(k,valid); this.#history.push(valid); return valid; }
  current(ownerId:string,projectId:string,bookId:string,edition:string,format:BookFormat,providerKey:string):BookPublicationLifecycleEvent|undefined { return this.#current.get(`${ownerId}:${projectId}:${bookId}:${edition}:${format}:${providerKey}`); }
  history(ownerId:string,bookId:string):readonly BookPublicationLifecycleEvent[]{ return Object.freeze(this.#history.filter(e=>e.ownerId===ownerId&&e.bookId===bookId)); }
}

export function isProviderVerifiedLivePublication(event:BookPublicationLifecycleEvent):boolean { const valid=validatePublicationLifecycleEvent(event); return valid.state==="live"&&Boolean(valid.providerListingId?.trim())&&Boolean(valid.providerReceiptRef?.trim())&&Boolean(valid.providerPublicationRef?.trim())&&Boolean(valid.providerTimestamp)&&valid.evidenceRefs.length>0; }
