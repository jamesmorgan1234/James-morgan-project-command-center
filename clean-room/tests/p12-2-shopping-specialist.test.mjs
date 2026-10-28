import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SHOPPING_SPECIALIST_PROFILE, validateShoppingOffer, assessShoppingTrip, rankShoppingTrips, assertShoppingTruthOwnership } from "../dist/specialists/index.js";

const offer=(overrides={})=>({id:"offer-1",ownerId:"owner-1",providerKey:"provider-1",merchantRef:"merchant-1",itemRef:"item-1",amount:5,timing:"immediate",truth:"verified",sourceRefs:["provider:offer"],observedAt:"2026-10-26T16:00:00Z",expiresAt:"2026-10-27T16:00:00Z",...overrides});

test("P12.2 specialist retains shopping truth ownership while Command Center only orchestrates",()=>{assert.equal(SHOPPING_SPECIALIST_PROFILE.truthOwner,"specialist:shopping");assert.doesNotThrow(()=>assertShoppingTruthOwnership("specialist:shopping"));assert.throws(()=>assertShoppingTruthOwnership("command-center"),/cannot duplicate specialist shopping truth/i);});

test("P12.2 expired offer cannot remain verified",()=>{assert.throws(()=>validateShoppingOffer(offer(),"2026-10-28T00:00:00Z"),/expired shopping offer/i);});

test("P12.2 delayed rebate never reduces out-of-pocket today",()=>{const option={merchantRef:"merchant-1",baseCost:100,travelCost:5,offers:[offer({amount:10,timing:"immediate"}),offer({id:"offer-2",amount:20,timing:"delayed_rebate",sourceRefs:["provider:rebate"]})]};const result=assessShoppingTrip(option,"preserve_cash_today","2026-10-26T17:00:00Z");assert.equal(result.outOfPocketToday,95);assert.equal(result.delayedSavings,20);assert.equal(result.effectiveFinalCost,75);});

test("P12.2 trip priority can prefer lowest cash today separately from lowest final cost",()=>{const a={merchantRef:"A",baseCost:90,travelCost:0,offers:[]};const b={merchantRef:"B",baseCost:100,travelCost:0,offers:[offer({merchantRef:"B",amount:20,timing:"delayed_rebate"})]};assert.equal(rankShoppingTrips([a,b],"preserve_cash_today","2026-10-26T17:00:00Z")[0].merchantRef,"A");assert.equal(rankShoppingTrips([a,b],"lowest_final_cost","2026-10-26T17:00:00Z")[0].merchantRef,"B");});

test("P12.2 closest practical ranks by actual travel time and fails closed when proximity is missing",()=>{const farCheap={merchantRef:"far",baseCost:40,travelCost:1,travelMinutes:35,offers:[]};const nearCostly={merchantRef:"near",baseCost:70,travelCost:5,travelMinutes:8,offers:[]};assert.equal(rankShoppingTrips([farCheap,nearCostly],"closest_practical","2026-10-26T17:00:00Z")[0].merchantRef,"near");assert.throws(()=>rankShoppingTrips([{merchantRef:"unknown",baseCost:10,travelCost:0,offers:[]}],"closest_practical","2026-10-26T17:00:00Z"),/requires travel minutes/i);});

test("P12.2 durable shopping evidence preserves truth timing privacy specialist ownership and practical travel evidence",()=>{const sql=readFileSync(new URL("../../supabase/migrations/20261026131000_p12_2_shopping_specialist.sql",import.meta.url),"utf8");assert.match(sql,/command_center_shopping_offer_history/i);assert.match(sql,/truth text not null check\(truth in \('verified','estimated','stale','unavailable'\)\)/i);assert.match(sql,/timing text not null check\(timing in \('immediate','delayed_rebate','cashback'\)\)/i);assert.match(sql,/truth_owner text not null default 'specialist:shopping'/i);assert.match(sql,/privacy_class text not null default 'personal_family'/i);assert.match(sql,/travel_minutes numeric/i);assert.match(sql,/shopping evidence is immutable/i);});
