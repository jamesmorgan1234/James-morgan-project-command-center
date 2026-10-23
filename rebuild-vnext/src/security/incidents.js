import { StateMachine } from '../kernel/state-machine.js';

const INCIDENT = Object.freeze({
  initialState: 'open',
  transitions: Object.freeze({
    open: ['contained', 'resolved'],
    contained: ['investigating', 'resolved'],
    investigating: ['contained', 'resolved'],
    resolved: ['reopened'],
    reopened: ['contained', 'investigating', 'resolved']
  })
});

export class SecurityIncident {
  constructor({ id, severity, summary }) {
    this.id = id;
    this.severity = severity;
    this.summary = summary;
    this.machine = new StateMachine(INCIDENT);
  }
  get state() { return this.machine.state; }
  transition(to, reason, evidence = null) { return this.machine.transition(to, { reason, evidence, initiator: 'security' }); }
}
