#!/usr/bin/env python3
"""Read-only structural QC of the five-company proposal package.
Does not contact GitHub, a database, production, customers or financial providers.
"""
from __future__ import annotations
import pathlib, json, re, hashlib, collections, sys
R=pathlib.Path(__file__).resolve().parents[1]

def data(name):return json.loads((R/'data'/name).read_text(encoding='utf-8'))
issues=[]
def check(ok,msg):
 if not ok:issues.append(msg)

reg=data('COMPANY_REGISTRY_PROPOSALS.json')
companies=reg['companies']
check(len(companies)==5,'company count !=5')
check([x['ordinal_proposed'] for x in companies]==list(range(108,113)),'bad ordinal sequence')
check(reg['current_registered_company_count']==107,'bad read-only baseline company count')
ids=set();pids=set();brainids=set()
for c in companies:
 n=c['ordinal_proposed'];cid=c['company_id_proposed'];pid=c['primary_project_id_proposed'];bid=c['brain_id_proposed']
 check(cid==f'company:future:{n:03d}',f'bad company id for {n}')
 check(pid==f'project:company:future:{n:03d}',f'bad project id for {n}')
 check(bid==f'brain:company:future:{n:03d}:v1',f'bad brain id for {n}')
 check(cid not in ids and pid not in pids and bid not in brainids,f'duplicate company/project/brain identity for {n}')
 ids.add(cid);pids.add(pid);brainids.add(bid)
 check(c['money_out_limit_usd']==0 and c['no_automatic_spending_or_reinvestment'] is True,f'financial invariant {n}')
 check(c['execution_authorized'] is False and c['truth_state']=='PLANNED_NOT_REGISTERED',f'unintended execution state {n}')
 p=R/c['source_preparation_file'];check(p.exists(),f'no roadmap for {n}')
 if p.exists():
  content=p.read_text(encoding='utf-8');check(hashlib.sha256(content.encode('utf-8')).hexdigest()==c['source_sha256'],f'roadmap hash mismatch {n}')
  check(f'**Company ID:** `{cid}`' in content,f'missing company id markdown {n}')
  check(f'**Primary project:** `{pid}`' in content,f'missing project id markdown {n}')
  pchecks=re.findall(r'^\*\*(\d{2})\. [^\n]+?:\*\*',content,re.M)
  check(sorted(map(int,pchecks))==list(range(1,29)),f'wrong 28-pass coverage for {n}: {len(pchecks)}')
  dimcodes=re.findall(r'^\*\*([A-Z]{1,2}) — [^\n]+?:\*\*',content,re.M)
  expect=[chr(x) for x in range(65,91)]+['A'+chr(x) for x in range(65,91)]+['B'+chr(x) for x in range(65,91)]
  check(len(dimcodes)==78 and set(dimcodes)==set(expect),f'wrong A-BZ dimension coverage for {n}: {len(dimcodes)}')
  check(content.count('### P')==8,f'wrong phased headings for {n}')
  check(len(content)>20000,f'roadmap too terse for {n}: {len(content)} chars')
  check('not a working company' in content.lower() or 'not built' in content.lower(),f'missing truth qualifier in {n}')

brains=data('SPECIALIST_BRAIN_PROPOSALS.json')['brains'];check(len(brains)==5,'brain count')
for b in brains:
 check(b['brain_id_proposed'] in brainids and b['company_id'] in ids,f'unknown brain ID {b["brain_id_proposed"]}')
 check(b['status']=='PLANNED_NOT_REGISTERED','brain falsely active')
 check(b['never_authorized_to_spend_or_reinvest'] is True and b['max_automatic_outgoing_spend_usd']==0,'brain spend policy')
 check(len(b['capability_tree'])>=15,'brain capabilities insufficient')
 check(len(b['agents'])>=10,'agent role outline insufficient')

checks=data('CONFORMANCE_106_CHECK_DRAFT.json')['checks']
check(len(checks)==530,'not all 530 check rows')
check(len({x['check_id'] for x in checks})==len(checks),'duplicate conformance check id')
for pid in pids:
 sub=[x for x in checks if x['project_id']==pid]
 check(len(sub)==106 and sum(x['group']=='28_PASS' for x in sub)==28 and sum(x['group']=='A_BZ' for x in sub)==78,f'bad 106 check breakdown {pid}')
 check(all(x['independent_verification'] is False and x['draft_status']=='DRAFT_MAPPED_PENDING_INDEPENDENT_AUDIT' and len(x['evidence'])>40 for x in sub),f'false conformance check pass or missing evidence {pid}')

caps=data('COMPANY_CAPABILITY_CATALOG.json')['capabilities']
check(len(caps)>400,'capability inventory unexpectedly small')
check(len({x['id'] for x in caps})==len(caps),'duplicate capability id')
check(all(x['company_id'] in ids and x['ready_to_execute'] is False for x in caps),'invalid capability registration state')

tasks=data('AGENCY_TASK_GRAPH.json')['tasks']
tmap={x['id']:x for x in tasks}
check(len(tmap)==len(tasks),'duplicate tasks')
check(len(tasks)>=500,'task inventory unexpectedly small')
check(all(x['project_id'] in pids and x['execution_authorized'] is False and x['status']=='planned' for x in tasks),'task authorization scope invalid')
for x in tasks:
 for dep in x['dependency_ids']:
  check(dep in tmap,f'broken dependency {x["id"]} => {dep}')
  if dep in tmap: check(tmap[dep]['project_id']==x['project_id'],f'cross company DAG edge {x["id"]} => {dep}')
# DFS cycle validation
color={};stack=[]
def visit(v):
 state=color.get(v,0)
 if state==2:return
 if state==1:
  issues.append('cycle: '+' -> '.join(stack+[v]));return
 color[v]=1;stack.append(v)
 for dep in tmap[v]['dependency_ids']:
  if dep in tmap:visit(dep)
 stack.pop();color[v]=2
for k in tmap:visit(k)
for pid in pids:
 sub=[t for t in tasks if t['project_id']==pid]
 gates=[t for t in sub if t['id'].endswith(':gate')]
 check(len(gates)==8,f'wrong phase gates for {pid}')
 check(len(sub)>=90,f'too few DAG tasks for {pid}')

phases=data('ROADMAP_PHASES.json')['phases']
check(len(phases)==40,'wrong phase count')
for pid in pids:
 chunk=[p for p in phases if p['project_id']==pid]
 check([p['phase'] for p in chunk]==[f'P{i}' for i in range(8)],f'phase order {pid}')

src=data('EXTERNAL_SOURCES_AND_VALIDATION.json')
check(len(src['sources'])>=10,'missing external source references')
for s in src['sources']:
 check(s['url'].startswith('https://') and s['company_id'] in ids,'invalid source ref')

for name in ['README.md','00_AUTHORITY_AND_PROTECTED_SCOPE.md','01_IMPLEMENTATION_AND_BUTTON_ACCEPTANCE.md','02_CROSS_PORTFOLIO_OVERLAP.md','03_RESEARCH_AND_VALIDATION.md','04_FUTURE_WORK_HANDOFF.md']:
 check((R/name).exists(),f'missing root doc {name}')
root_docs='\n'.join((R/x).read_text(encoding='utf-8') for x in ['README.md','00_AUTHORITY_AND_PROTECTED_SCOPE.md','04_FUTURE_WORK_HANDOFF.md'])
for token in ['VeloClip','CrowdSkein','RevoCapture','$0','Command Center','112','GitHub']:
 check(token in root_docs,f'missing key boundary {token}')

# Manifest confirms integrity of files made by generator. Build script may be updated deliberately;
# use the packaging helper to update manifest after final source changes.
manifest=data('PACKAGE_FILE_MANIFEST.json')['files']
missing=[]
for x in manifest:
 p=R/x['path']
 if not p.exists(): missing.append(x['path']);continue
 if hashlib.sha256(p.read_bytes()).hexdigest()!=x['sha256']:missing.append(x['path'])
check(not missing,'source hash manifest mismatches '+str(missing[:10]))

result={'state':'PASS' if not issues else 'FAIL','checks_per_company':106,'companies':len(companies),'brain_manifests':len(brains),'work_units':len(tasks),'capability_candidates':len(caps),'conformance_entries':len(checks),'phase_gates':len(phases),'problems':issues}
print(json.dumps(result,indent=2))
sys.exit(1 if issues else 0)
