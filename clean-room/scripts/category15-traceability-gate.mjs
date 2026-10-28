import {readFileSync} from 'node:fs';import {resolve,dirname} from 'node:path';import {fileURLToPath} from 'node:url';
import {validateRequirementTraceability} from './category15-requirement-traceability-validation.mjs';
import {validateTraceabilityRepositoryEvidence} from './p15-1-repository-evidence.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..'),path=resolve(root,'clean-room/evidence/category15-requirement-traceability.json');
const d=JSON.parse(readFileSync(path,'utf8')),structure=validateRequirementTraceability(d),repository=validateTraceabilityRepositoryEvidence(d,{repoRoot:root});
const complete=structure.closureComplete&&repository.valid;
console.log(JSON.stringify({phase:'P15.1',status:complete?'VERIFIED_COMPLETE':'SOURCE_RECOVERED_TRACEABILITY_OPEN',...structure,repositoryEvidenceValid:repository.valid,repositoryErrors:repository.errors,advancementAllowed:complete}));
if(!complete)process.exitCode=1;
