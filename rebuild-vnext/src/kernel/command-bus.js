import { CommandExecutionError, RegistrationError } from './errors.js';

export class CommandBus {
  #handlers = new Map();
  #validators = new Map();
  #results = new Map();
  #invariants;
  #events;

  constructor({ invariants, events }) {
    this.#invariants = invariants;
    this.#events = events;
  }

  define(type, { validate = () => true, handler }) {
    if (this.#handlers.has(type)) throw new RegistrationError(`Command already defined: ${type}`);
    if (typeof handler !== 'function') throw new TypeError('Command handler is required');
    this.#validators.set(type, validate);
    this.#handlers.set(type, handler);
  }

  async execute(command, context = {}) {
    const handler = this.#handlers.get(command?.type);
    if (!handler) throw new RegistrationError(`Unknown command: ${command?.type}`);
    const requestId = command.requestId;
    if (!requestId) throw new TypeError('command.requestId is required');
    if (this.#results.has(requestId)) return this.#results.get(requestId);
    this.#validators.get(command.type)(command);
    const executionContext = Object.freeze({ ...context, command });
    await this.#invariants.assert(executionContext, 'before');
    try {
      const value = await handler(command, context);
      await this.#invariants.assert(Object.freeze({ ...context, command, result: value }), 'after');
      const result = Object.freeze({ status: 'verified', requestId, value });
      this.#results.set(requestId, result);
      if (this.#events) {
        await this.#events.publish({ type: 'command.verified', requestId, commandType: command.type, at: Date.now() });
      }
      return result;
    } catch (error) {
      if (error?.code === 'INVARIANT_VIOLATION') throw error;
      throw new CommandExecutionError(`Command ${command.type} failed`, { requestId, commandType: command.type }, error);
    }
  }
}
