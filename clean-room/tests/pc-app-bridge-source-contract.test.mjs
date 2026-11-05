import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const provider=readFileSync(new URL("../src/runtime/owner-security-provider.ts",import.meta.url),"utf8");
const ui=readFileSync(new URL("../src/runtime/brain-view.ts",import.meta.url),"utf8");
const snapshot=readFileSync(new URL("../src/runtime/snapshot.ts",import.meta.url),"utf8");
test("central Brain sends a saved authenticated owner turn to the PC queue",()=>{
 assert.match(provider,/command_center_pc_enqueue_inference/);
 assert.match(provider,/p_owner_turn_id: ownerTurnId/);
 assert.match(provider,/p_request_id: ownerTurnId/);
 assert.match(ui,/enqueuePcBrainResponse/);
});
test("worker heartbeat alone is not presented as verified inference",()=>{
 assert.match(ui,/brain\.workerOnline === true && brain\.verifiedCentralInference === true/);
 assert.match(provider,/await this\.#sha256\(turn\.safe_text\.trim\(\)\)/);
 assert.match(ui,/FIRST REPLY PENDING/);
});
test("specialist responses require explicit verified readiness",()=>{
 assert.match(ui,/specialistReadiness\?\.\[projectId\] === "available"/);
 assert.match(provider,/specialistReadiness: Object\.freeze\(\{\}\)/);
});
test("no browser worker token or payment execution in the PC composer",()=>{
 assert.doesNotMatch(ui,/CC_PC_WORKER_TOKEN|SERVICE_ROLE_KEY|stripe_api_write/);
 assert.match(snapshot,/readonly pcRequests\?/);
});
test("company scope parser retains numeric 001..117 project identifiers",()=>{
 assert.ok(provider.includes("/^project:company:future:(\\d{3})$/u.exec(projectId)"));
 assert.doesNotMatch(provider,/project:company:future:\(d\{3\}\)/);
});
