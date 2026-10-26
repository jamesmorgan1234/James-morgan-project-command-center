import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DigitalProductVentureRegistry, validateDigitalProductArtifact, validateDigitalProductState, DIGITAL_PRODUCT_TRUTH_OWNER } from "../dist/specialists/index.js";

const binding={id:"venture-1",ownerId:"owner-1",projectId:"digital-1",companyId:"company-1",storefrontRef:"storefront-1",deliveryProviderRef:"delivery-1",analyticsProviderRefs:["analytics-1"],sourceRefs:["venture:source"]};

test("P12.5 digital-product specialist owns venture truth",()=>{assert.equal(DIGITAL_PRODUCT_TRUTH_OWNER,"specialist:digital_products");});

test("P12.5 new digital-product venture registers without hard-coded existing venture logic",()=>{const registry=new DigitalProductVentureRegistry();registry.register(binding);registry.register({...binding,id:"venture-2",projectId:"future-venture",companyId:"company-2",storefrontRef:"storefront-2",deliveryProviderRef:"delivery-2",sourceRefs:["future:source"]});assert.equal(registry.require("owner-1","future-venture").projectId,"future-venture");});

test("P12.5 storefronts remain isolated across ventures",()=>{const registry=new DigitalProductVentureRegistry();registry.register(binding);assert.throws(()=>registry.register({...binding,id:"venture-2",projectId:"other",companyId:"company-2"}),/storefront is isolated/i);});

test("P12.5 product files delivery pricing and state remain exact venture scoped",()=>{const registry=new DigitalProductVentureRegistry();const bound=registry.register(binding);assert.doesNotThrow(()=>validateDigitalProductArtifact({id:"artifact-1",ownerId:"owner-1",projectId:"digital-1",productRef:"product-1",fileRef:"file-1",contentHash:"sha256:file",deliveryRef:"delivery:item-1",price:9.99,currency:"USD",sourceRefs:["file:source"]},bound));for(const domain of ["product_file","delivery","storefront","pricing","promotion","analytics","support"])assert.doesNotThrow(()=>validateDigitalProductState({id:`state-${domain}`,ownerId:"owner-1",projectId:"digital-1",domain,canonicalRef:`ref:${domain}`,state:"ok",sourceRefs:[`source:${domain}`]},bound));});

test("P12.5 durable digital-product evidence is generic isolated and immutable",()=>{const sql=readFileSync(new URL("../../supabase/migrations/20261026134000_p12_5_digital_products_specialist.sql",import.meta.url),"utf8");assert.match(sql,/command_center_digital_product_venture_history/i);assert.match(sql,/storefront_ref text not null/i);assert.match(sql,/delivery_provider_ref text not null/i);assert.match(sql,/command_center_digital_product_state_history/i);assert.match(sql,/digital-product evidence is immutable/i);});
