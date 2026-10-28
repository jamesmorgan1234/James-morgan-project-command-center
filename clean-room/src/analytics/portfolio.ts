export interface ProjectDeliveryMetric {
  readonly projectId: string;
  readonly verifiedCompleted: number;
  readonly verifiedTotal: number | null;
  readonly agencyCompleted: number;
  readonly agencyTotal: number | null;
  readonly cycleTimeMs: number | null;
  readonly blockedTimeMs: number;
  readonly ownerWaitTimeMs: number;
  readonly evidenceRefs: readonly string[];
}

export function projectAnalytics(metric: ProjectDeliveryMetric): Readonly<{ projectPercent: number | null; agencyPercent: number | null; cycleTimeMs: number | null; blockedTimeMs: number; ownerWaitTimeMs: number }> {
  if (metric.evidenceRefs.length === 0) throw new Error("project analytics require evidence");
  const percent = (done: number, total: number | null): number | null => total === null || total <= 0 || done < 0 || done > total ? null : Math.round((done / total) * 10000) / 100;
  return Object.freeze({ projectPercent: percent(metric.verifiedCompleted, metric.verifiedTotal), agencyPercent: percent(metric.agencyCompleted, metric.agencyTotal), cycleTimeMs: metric.cycleTimeMs, blockedTimeMs: metric.blockedTimeMs, ownerWaitTimeMs: metric.ownerWaitTimeMs });
}

import {validateRequirementClosure,type RequirementClosureRecord} from '../kernel/evidence.js';
import {authorizeAnalytics,analyticsEvidence,immutable,invariant,bounded,equalScope,stringSet,timestamp,type AnalyticsScope,type AnalyticsAccess} from './contracts.js';
export interface PortfolioRequirement {readonly scope:AnalyticsScope;readonly closure:RequirementClosureRecord;readonly dependencyIds:readonly string[];readonly blockedIntervals:readonly {start:string;end:string}[];readonly ownerWaitIntervals:readonly {start:string;end:string}[];readonly startedAt:string|null;readonly deliveredAt:string|null;readonly milestoneRef:string;readonly risk:'low'|'medium'|'high';readonly resourceUnits:number|null}
export function intervalDuration(intervals:readonly {start:string;end:string}[]):number {const ordered=intervals.map(i=>({start:timestamp(i.start),end:timestamp(i.end)})).sort((a,b)=>a.start-b.start);let total=0,last=-Infinity;for(const i of ordered){invariant(i.end>=i.start,'invalid_portfolio_interval');total+=Math.max(0,i.end-Math.max(i.start,last));last=Math.max(last,i.end);}return total;}
export function evidencePortfolio(access:AnalyticsAccess,scope:AnalyticsScope,records:readonly PortfolioRequirement[],denominator:{readonly requirementIds:readonly string[];readonly evidenceIds:readonly string[]}|null,agency:{readonly completed:number;readonly total:number|null;readonly evidenceIds:readonly string[]}|null){
 authorizeAnalytics(access,'read',scope,'portfolio');invariant(new Set(records.map(r=>r.closure.requirementId)).size===records.length,'duplicate_portfolio_requirement');
 if(denominator){stringSet(denominator.requirementIds,true);analyticsEvidence(access,scope,denominator.evidenceIds);invariant(records.every(r=>denominator.requirementIds.includes(r.closure.requirementId)),'portfolio_requirement_outside_authority');}
 const verified=new Set<string>();let blocked=0,wait=0,cycles:number[]=[];const statuses:Record<string,number>={};
 for(const r of records){invariant(equalScope(r.scope,scope),'portfolio_scope_mismatch');const c=validateRequirementClosure(r.closure);statuses[c.truthState]=(statuses[c.truthState]??0)+1;if(c.truthState==='verified'){analyticsEvidence(access,scope,c.evidenceIds);verified.add(c.requirementId);}if(r.resourceUnits!==null)bounded(r.resourceUnits);blocked+=intervalDuration(r.blockedIntervals);wait+=intervalDuration(r.ownerWaitIntervals);for(const i of [...r.blockedIntervals,...r.ownerWaitIntervals])invariant(timestamp(i.end)<=timestamp(access.now()),'future_portfolio_interval');if(r.startedAt!==null&&r.deliveredAt!==null){const start=timestamp(r.startedAt),end=timestamp(r.deliveredAt);invariant(end>=start&&end<=timestamp(access.now()),'invalid_portfolio_delivery');if(c.truthState==='verified')cycles.push(end-start);}}
 for(const r of records)if(verified.has(r.closure.requirementId))invariant([...r.dependencyIds,...r.closure.dependencyIds].every(id=>verified.has(id)),'verified_progress_has_unverified_dependency');
 if(agency){bounded(agency.completed);if(agency.total!==null)bounded(agency.total);analyticsEvidence(access,scope,agency.evidenceIds);}
 const starts=records.map(r=>r.startedAt).filter((s):s is string=>s!==null).map(timestamp),span=starts.length?timestamp(access.now())-Math.min(...starts):0;
 return immutable({scope,verifiedCompleted:verified.size,deliveredCount:cycles.length,throughputPerHour:span>0?cycles.length/(span/3600000):null,measurementWindow:starts.length?{start:new Date(Math.min(...starts)).toISOString(),end:access.now()}:null,riskCounts:Object.fromEntries(["low","medium","high"].map(risk=>[risk,records.filter(r=>r.risk===risk).length])),resourceUnits:records.some(r=>r.resourceUnits===null)?null:records.reduce((sum,r)=>sum+r.resourceUnits!,0),milestones:records.map(r=>({reference:r.milestoneRef,state:r.closure.truthState})),denominatorTrusted:denominator!==null,statuses,unresolvedDependencyIds:[...new Set(records.flatMap(r=>[...r.dependencyIds,...r.closure.dependencyIds]).filter(id=>!verified.has(id)))].sort(),...projectAnalytics({projectId:scope.projectId,verifiedCompleted:verified.size,verifiedTotal:denominator?.requirementIds.length??null,agencyCompleted:agency?.completed??0,agencyTotal:agency?.total??null,cycleTimeMs:cycles.length?cycles.reduce((a,b)=>a+b,0)/cycles.length:null,blockedTimeMs:blocked,ownerWaitTimeMs:wait,evidenceRefs:['validated:portfolio']}),authorizationGranted:false});
}
export function authorizedPortfolioRollup(access:AnalyticsAccess,projects:readonly {scope:AnalyticsScope;verified:number;total:number|null;evidenceIds:readonly string[]}[]){let verified=0,total=0,unknown=false;for(const p of projects){authorizeAnalytics(access,'read',p.scope,'portfolio-rollup');analyticsEvidence(access,p.scope,p.evidenceIds);bounded(p.verified);if(p.total===null)unknown=true;else{bounded(p.total);invariant(p.verified<=p.total,'portfolio_false_completion');total+=p.total;}verified+=p.verified;}return immutable({projects:projects.length,verified,total:unknown?null:total,percent:unknown||total===0?null:verified/total*100,underlyingPrivateContentIncluded:false,authorizationGranted:false});}
