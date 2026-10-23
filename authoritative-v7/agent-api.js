import { client } from './data.js';

export async function requestProjectAutoRecheck(projectId) {
  const cleanProjectId=String(projectId||'').trim();
  if(!cleanProjectId)return{ok:true,recheck_requested:false,reason:'project_required'};
  const {data,error}=await client.rpc('cc7_agent_owner_request_project_auto_recheck',{p_project_id:cleanProjectId});
  if(error)throw error;
  if(!data?.ok)throw new Error('Project Auto recheck did not verify.');
  return data;
}
