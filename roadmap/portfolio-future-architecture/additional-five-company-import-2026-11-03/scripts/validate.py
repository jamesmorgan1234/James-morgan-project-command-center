#!/usr/bin/env python3
from pathlib import Path
from collections import Counter, defaultdict
import json, hashlib, re, sys
root=Path(__file__).resolve().parent.parent
load=lambda x:json.loads((root/'data'/x).read_text('utf8'))
reg=load('PROPOSED_COMPANY_REGISTRY.json'); companies=reg['companies']; brain=load('SPECIALIST_BRAIN_CATALOG.json')['brains']; tasks=load('AGENCY_EXECUTABLE_TASK_PROPOSALS.json')['tasks']; caps=load('CAPABILITY_CATALOG.json')['capabilities']; checks=load('CONFORMANCE_106_X_5_DRAFT.json')['checks'];phases=load('ROADMAP_PHASE_GATES.json')['phases']
errors=[]
def ck(cond,s):
 if not cond: errors.append(s)
ck(len(companies)==5,'five companies')
ck([c['ordinal_proposed'] for c in companies]==list(range(113,118)),'proposed ordinals 113..117')
ck(len({c['company_id_proposed'] for c in companies})==5,'unique companies')
ck(len(brain)==5,'5 brain packs')
ck(len(tasks)==520,'520 work packets (12+gate each of eight phases per company)')
ck(len(checks)==530,'530 individual roadmap check rows')
ck(len(phases)==40,'40 phase gate rows')
ck(len(caps)>=500,'broad company capability catalogue')
ck(len({x['id'] for x in caps})==len(caps),'capability identifiers unique')
ck(len({x['id'] for x in tasks})==len(tasks),'task identifiers unique')
ck(len({x['id'] for x in checks})==len(checks),'check identifiers unique')
ck(all(x['result']=='PREPARED_NOT_INDEPENDENTLY_VERIFIED' and x['actual_pass'] is False for x in checks),'all conformance statuses honest')
ck(all(x['status']=='prepared_not_executed' and x['expected_outgoing_spend_usd']==0 for x in tasks),'all tasks unexecuted and zero spend')
expected=[chr(x) for x in range(65,91)]+['A'+chr(x) for x in range(65,91)]+['B'+chr(x) for x in range(65,91)]
for c in companies:
 n=c['ordinal_proposed'];pid=c['primary_project_id_proposed'];cid=c['company_id_proposed'];bid=c['brain_id_proposed']
 ck(cid==f'company:future:{n:03d}' and pid==f'project:company:future:{n:03d}',f'{n} ID')
 ck(bid==f'brain:company:future:{n:03d}:v1',f'{n} brain ID')
 file=root/c['source_preparation_file'];ck(file.is_file(),f'{n} roadmap exists')
 if file.exists():
  txt=file.read_text('utf8');ck(hashlib.sha256(txt.encode()).hexdigest()==c['source_sha256'],f'{n} source SHA')
  ps=re.findall(r'^\*\*(\d{2})\. [^\n]+?:\*\*',txt,re.M)
  ds=re.findall(r'^\*\*([A-Z]{1,2}) — [^\n]+?:\*\*',txt,re.M)
  ck([int(x) for x in ps]==list(range(1,29)),f'{n} 28 passes')
  ck(ds==expected,f'{n} 78 A–BZ')
  ck(len(txt)>25000,f'{n} roadmap substantive length')
  ck(txt.count('### P')==8,f'{n} 8 phases')
 subs=[x for x in checks if x['company_id']==cid]
 ck(len(subs)==106 and sum(x['kind']=='28_PASS' for x in subs)==28,f'{n} individual 106 checks')
 ck(len([x for x in brain if x['company_id']==cid])==1,f'{n} brain pack')
 ck(len([x for x in caps if x['company_id']==cid])>=90,f'{n} capabilities')
 ck(len([x for x in tasks if x['project_id']==pid])==104,f'{n} 104 work packets')
 ck(len([x for x in phases if x['project_id']==pid])==8,f'{n} phases')
taskmap={x['id']:x for x in tasks}
for t in tasks:
 for d in t['dependency_ids']:
  ck(d in taskmap, f'bad dependency {t["id"]} => {d}')
  if d in taskmap:ck(t['project_id']==taskmap[d]['project_id'],f'cross-company dependency {t["id"]}')
seen={}
def visit(x):
 if seen.get(x)==2:return
 if seen.get(x)==1:errors.append('dependency cycle '+x);return
 seen[x]=1
 for d in taskmap[x]['dependency_ids']:
  if d in taskmap:visit(d)
 seen[x]=2
for x in taskmap:visit(x)
for id in (113,114):
 idx=load('SOURCE_ARCHIVE_TEXT_INDEX.json')['source_index']
 ck(sum(x['company']==id for x in idx)>=10,f'{id} original archive text preserved')
for k,v in Counter([x['company_ordinal'] for x in tasks]).items():ck(v==104,f'{k} packet count')
report={'passed':len(errors)==0,'errors':errors,'companies':len(companies),'brains':len(brain),'work_packets':len(tasks),'capabilities':len(caps),'conformance_mappings':len(checks),'phase_gates':len(phases),'truth':'PREPARATION_QA_ONLY_NO_EXTERNAL_CHANGES'}
print(json.dumps(report,indent=2))
sys.exit(1 if errors else 0)
