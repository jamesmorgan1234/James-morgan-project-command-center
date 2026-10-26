export type DigitalProductDomain = "product_file" | "delivery" | "storefront" | "pricing" | "promotion" | "analytics" | "support";

export interface DigitalProductVentureBinding {
  readonly id: string;
  readonly ownerId: string;
  readonly projectId: string;
  readonly companyId: string;
  readonly storefrontRef: string;
  readonly deliveryProviderRef: string;
  readonly analyticsProviderRefs: readonly string[];
  readonly sourceRefs: readonly string[];
}

export interface DigitalProductArtifact {
  readonly id: string;
  readonly ownerId: string;
  readonly projectId: string;
  readonly productRef: string;
  readonly fileRef: string;
  readonly contentHash: string;
  readonly deliveryRef: string;
  readonly price: number;
  readonly currency: string;
  readonly sourceRefs: readonly string[];
}

export interface DigitalProductState {
  readonly id: string;
  readonly ownerId: string;
  readonly projectId: string;
  readonly domain: DigitalProductDomain;
  readonly canonicalRef: string;
  readonly state: string;
  readonly providerRef?: string;
  readonly sourceRefs: readonly string[];
}

function refs(values: readonly string[], label: string, required=true): readonly string[] {
  if (!Array.isArray(values) || (required&&values.length===0) || values.some((value)=>!value.trim())) throw new Error(`${label} required`);
  return Object.freeze([...new Set(values.map((value)=>value.trim()))]);
}

export class DigitalProductVentureRegistry {
  readonly #ventures=new Map<string,DigitalProductVentureBinding>();
  readonly #storefronts=new Map<string,string>();

  register(input:DigitalProductVentureBinding):DigitalProductVentureBinding {
    if(!input.id.trim()||!input.ownerId.trim()||!input.projectId.trim()||!input.companyId.trim()||!input.storefrontRef.trim()||!input.deliveryProviderRef.trim()) throw new Error("digital-product venture identity/company/storefront/delivery required");
    const analyticsProviderRefs=refs(input.analyticsProviderRefs,"digital-product analytics providers",false);
    const sourceRefs=refs(input.sourceRefs,"digital-product source refs");
    const key=`${input.ownerId}:${input.projectId}`;
    const prior=this.#ventures.get(key);
    if(prior&&(prior.companyId!==input.companyId||prior.storefrontRef!==input.storefrontRef||prior.deliveryProviderRef!==input.deliveryProviderRef)) throw new Error("digital-product venture provider binding cannot be silently substituted");
    const storefrontOwner=this.#storefronts.get(`${input.ownerId}:${input.storefrontRef}`);
    if(storefrontOwner&&storefrontOwner!==input.projectId) throw new Error("digital-product storefront is isolated to another venture");
    const frozen=Object.freeze({...input,analyticsProviderRefs,sourceRefs});
    this.#ventures.set(key,frozen);this.#storefronts.set(`${input.ownerId}:${input.storefrontRef}`,input.projectId);return frozen;
  }

  require(ownerId:string,projectId:string):DigitalProductVentureBinding {const value=this.#ventures.get(`${ownerId}:${projectId}`);if(!value)throw new Error("unknown digital-product venture");return value;}
}

export function validateDigitalProductArtifact(input:DigitalProductArtifact,binding:DigitalProductVentureBinding):DigitalProductArtifact {
  if(input.ownerId!==binding.ownerId||input.projectId!==binding.projectId) throw new Error("digital-product artifact cannot cross venture boundary");
  if(!input.id.trim()||!input.productRef.trim()||!input.fileRef.trim()||!input.contentHash.trim()||!input.deliveryRef.trim()||!input.currency.trim()) throw new Error("digital-product artifact identity/file/hash/delivery/price required");
  if(!Number.isFinite(input.price)||input.price<0) throw new Error("digital-product price invalid");
  return Object.freeze({...input,sourceRefs:refs(input.sourceRefs,"digital-product artifact source refs")});
}

export function validateDigitalProductState(input:DigitalProductState,binding:DigitalProductVentureBinding):DigitalProductState {
  if(input.ownerId!==binding.ownerId||input.projectId!==binding.projectId) throw new Error("digital-product state cannot cross venture boundary");
  if(!input.id.trim()||!input.canonicalRef.trim()||!input.state.trim()) throw new Error("digital-product state identity/ref/state required");
  return Object.freeze({...input,sourceRefs:refs(input.sourceRefs,"digital-product state source refs")});
}

export const DIGITAL_PRODUCT_TRUTH_OWNER="specialist:digital_products" as const;
