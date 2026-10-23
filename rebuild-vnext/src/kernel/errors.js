export class CommandCenterError extends Error {
  constructor(message, { code = 'CC_ERROR', details = undefined, cause = undefined } = {}) {
    super(message, { cause });
    this.name = new.target.name;
    this.code = code;
    this.details = details;
  }
}

export class InvariantViolationError extends CommandCenterError {
  constructor(message, details) {
    super(message, { code: 'INVARIANT_VIOLATION', details });
  }
}

export class RegistrationError extends CommandCenterError {
  constructor(message, details) {
    super(message, { code: 'REGISTRATION_ERROR', details });
  }
}

export class StateTransitionError extends CommandCenterError {
  constructor(message, details) {
    super(message, { code: 'INVALID_STATE_TRANSITION', details });
  }
}

export class CommandExecutionError extends CommandCenterError {
  constructor(message, details, cause) {
    super(message, { code: 'COMMAND_EXECUTION_ERROR', details, cause });
  }
}

export class BootstrapError extends CommandCenterError {
  constructor(message, details, cause) {
    super(message, { code: 'BOOTSTRAP_ERROR', details, cause });
  }
}
