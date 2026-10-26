export interface CommerceProjectBinding {
  readonly id: string;
  readonly ownerId: string;
  readonly projectId: string;
  readonly companyId: string;
  readonly storeAccountRef: string;
  readonly supplierAccountRefs: readonly string[];
  readonly providerRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly observedAt: string;
}

export interface CommerceProductEconomics {
  readonly id: string;
  readonly ownerId: string;
  readonly projectId: string;
  readonly productRef: string;
  readonly supplierRef: string;
  readonly landedCost: number;
  readonly salePrice: number;
  readonly currency: string;
  readonly observedAt: string;
  readonly sourceRefs: readonly string[];
}

export interface CommerceStateEvidence {
  readonly id: string;
  readonly ownerId: string;
  readonly projectId: string;
  readonly domain: "catalog" | "supplier" | "pricing" | "fulfillment" | "marketing" | "revenue";
  readonly canonicalRef: string;
  readonly state: string;
  readonly observedAt: string;
  readonly sourceRefs: readonly string[];
}

function refs(values: readonly string[], label: string): readonly string[] {
  if (!Array.isArray(values) || values.length === 0 || values.some((value)=>!value.trim())) throw new Error(`${label} required`);
  return Object.freeze([...new Set(values.map((value)=>value.trim()))]);
}

function time(value:string,label:string):void { if(!Number.isFinite(Date.parse(value))) throw new Error(`${label} invalid`); }

export class CommerceIsolationRegistry {
  readonly #bindings=new Map<string,CommerceProjectBinding>();
  readonly #stores=new Map<string,string>();
  readonly #suppliers=new Map<string,string>();

  bind(input:CommerceProjectBinding):CommerceProjectBinding {
    if(!input.id.trim()||!input.ownerId.trim()||!input.projectId.trim()||!input.companyId.trim()||!input.storeAccountRef.trim()) throw new Error("commerce project identity/company/store required");
    time(input.observedAt,"commerce binding observedAt");
    const supplierAccountRefs=refs(input.supplierAccountRefs,"commerce supplier refs");
    const providerRefs=refs(input.providerRefs,"commerce provider refs");
    const sourceRefs=refs(input.sourceRefs,"commerce source refs");
    const key=`${input.ownerId}:${input.projectId}`;
    const prior=this.#bindings.get(key);
    if(prior&&(prior.companyId!==input.companyId||prior.storeAccountRef!==input.storeAccountRef)) throw new Error("commerce project store/company binding cannot be silently substituted");
    const storeOwner=this.#stores.get(`${input.ownerId}:${input.storeAccountRef}`);
    if(storeOwner&&storeOwner!==input.projectId) throw new Error("commerce store account is isolated to another project");
    for(const supplier of supplierAccountRefs){const owner=this.#suppliers.get(`${input.ownerId}:${supplier}`);if(owner&&owner!==input.projectId) throw new Error("commerce supplier account is isolated to another project");}
    const binding=Object.freeze({...input,supplierAccountRefs,providerRefs,sourceRefs});
    this.#bindings.set(key,binding);this.#stores.set(`${input.ownerId}:${input.storeAccountRef}`,input.projectId);for(const supplier of supplierAccountRefs)this.#suppliers.set(`${input.ownerId}:${supplier}`,input.projectId);return binding;
  }

  require(ownerId:string,projectId:string):CommerceProjectBinding {const value=this.#bindings.get(`${ownerId}:${projectId}`);if(!value)throw new Error("unknown commerce project binding");return value;}
}

export function validateCommerceEconomics(input:CommerceProductEconomics,binding:CommerceProjectBinding):CommerceProductEconomics {
  if(!input.id.trim()||!input.ownerId.trim()||!input.projectId.trim()||!input.productRef.trim()||!input.supplierRef.trim()||!input.currency.trim()) throw new Error("commerce economics identity/scope/product/supplier/currency required");
  if(input.ownerId!==binding.ownerId||input.projectId!==binding.projectId||!binding.supplierAccountRefs.includes(input.supplierRef)) throw new Error("commerce economics cannot cross project/supplier boundary");
  if(!Number.isFinite(input.landedCost)||input.landedCost<0||!Number.isFinite(input.salePrice)||input.salePrice<0) throw new Error("commerce pricing values invalid");
  time(input.observedAt,"commerce economics observedAt");
  return Object.freeze({...input,sourceRefs:refs(input.sourceRefs,"commerce economics source refs")});
}

export function validateCommerceState(input:CommerceStateEvidence,binding:CommerceProjectBinding):CommerceStateEvidence {
  if(!input.id.trim()||!input.canonicalRef.trim()||!input.state.trim()) throw new Error("commerce state identity/ref/state required");
  if(input.ownerId!==binding.ownerId||input.projectId!==binding.projectId) throw new Error("commerce state cannot cross project boundary");
  time(input.observedAt,"commerce state observedAt");
  return Object.freeze({...input,sourceRefs:refs(input.sourceRefs,"commerce state source refs")});
}

export const COMMERCE_TRUTH_OWNER="specialist:commerce" as const;
