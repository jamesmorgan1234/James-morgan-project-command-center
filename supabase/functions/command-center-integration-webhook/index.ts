import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"content-type,x-command-center-webhook-secret","Access-Control-Allow-Methods":"POST,OPTIONS","Content-Type":"application/json"};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:cors});
const hex=async(value:string)=>{const bytes=new TextEncoder().encode(value);const digest=await crypto.subtle.digest("SHA-256",bytes);return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,"0")).join("");};

Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
  if(req.method!=="POST")return json({error:"Method not allowed"},405);
  const secret=(req.headers.get("x-command-center-webhook-secret")||"").trim();
  if(!secret)return json({error:"Webhook secret required"},401);
  let body:any={};try{body=await req.json();}catch{return json({error:"Invalid JSON"},400);}
  const publicKey=String(body?.public_key||"").trim();
  const eventId=String(body?.event_id||"").trim()||crypto.randomUUID();
  const payload=body?.payload;
  if(!publicKey||!payload||typeof payload!=="object"||Array.isArray(payload))return json({error:"public_key and object payload are required"},400);
  const url=Deno.env.get("SUPABASE_URL")!;
  const service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data,error}=await admin.rpc("command_center_integration_webhook_ingest_service",{p_public_key:publicKey,p_secret_hash:await hex(secret),p_provider_event_id:eventId,p_payload:payload});
  if(error){const message=String(error.message||"");const auth=/secret|endpoint not found/i.test(message);return json({error:auth?"Unauthorized webhook":"Webhook intake failed"},auth?401:400);}
  return json(data,202);
});
