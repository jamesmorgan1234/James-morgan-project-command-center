import { createExecutionHandler } from './handler.mjs';
Deno.serve(createExecutionHandler({supabaseUrl:Deno.env.get('SUPABASE_URL') ?? '',publishableKey:Deno.env.get('SUPABASE_ANON_KEY') ?? ''}));
