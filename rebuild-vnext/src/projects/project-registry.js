import { RegistrationError } from '../kernel/errors.js';
export const PROJECT_STATES = Object.freeze(['pending','in_progress','implemented','qa_pending','verified','locked','blocked','reopened','excluded','deferred','superseded']);
export class ProjectRegistry {
  #projects = new Map();
  register({id,name,type,state='pending',roadmapRevision=1,metadata={},provenance}) {
    if(!id||!name||!type||!provenance) throw new RegistrationError('Project requires id, name, type, provenance');
    if(this.#projects.has(id)) throw new RegistrationError(`Duplicate project: ${id}`);
    if(!PROJECT_STATES.includes(state)) throw new RegistrationError(`Unknown project state: ${state}`);
    const now=Date.now(); const project=Object.freeze({id,name,type,state,roadmapRevision,metadata:structuredClone(metadata),provenance:structuredClone(provenance),version:1,createdAt:now,updatedAt:now}); this.#projects.set(id,project); return project;
  }
  get(id){return this.#projects.get(id)??null;} list(){return Object.freeze([...this.#projects.values()]);}
  update(id,changes,{expectedVersion,provenance}) { const current=this.get(id); if(!current) throw new RegistrationError(`Unknown project: ${id}`); if(expectedVersion!==current.version) throw new RegistrationError(`Project version conflict: ${id}`); if(!provenance) throw new RegistrationError('Project update provenance required'); const nextState=changes.state??current.state; if(!PROJECT_STATES.includes(nextState)) throw new RegistrationError(`Unknown project state: ${nextState}`); const next=Object.freeze({...current,...structuredClone(changes),state:nextState,provenance:structuredClone(provenance),version:current.version+1,updatedAt:Date.now()}); this.#projects.set(id,next); return next; }
}
