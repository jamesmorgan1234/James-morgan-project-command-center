import {client} from './data.js';

export async function executeAgentRun(runId){
  if(!runId)throw new Error('Agent run is required.');
  const {data,error}=await client.rpc('cc7_agent_owner_execute_run',{p_run_id:runId});
  if(error)throw error;
  if(!data?.ok)throw new Error('V7 Agent execution did not verify.');
  return data;
}
