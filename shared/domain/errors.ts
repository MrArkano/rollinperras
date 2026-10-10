/**
 * Errores de dominio específicos. El manejador HTTP centralizado
 * (`shared/presentation/http.ts`) los traduce a códigos de estado.
 */
export abstract class DomainError extends Error {
  abstract readonly code: string

  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = new.target.name
  }
}

export interface ValidationIssue {
  readonly path: string
  readonly message: string
}

export class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR'

  constructor(
    message: string,
    readonly issues: readonly ValidationIssue[] = [],
  ) {
    super(message)
  }
}

export class NotFoundError extends DomainError {
  readonly code = 'NOT_FOUND'
}

export class ConflictError extends DomainError {
  readonly code = 'CONFLICT'
}

export class UnauthorizedError extends DomainError {
  readonly code = 'UNAUTHORIZED'
}

export class ForbiddenError extends DomainError {
  readonly code = 'FORBIDDEN'
}

export class RateLimitError extends DomainError {
  readonly code = 'RATE_LIMITED'

  constructor(
    message: string,
    readonly retryAfterSeconds: number,
  ) {
    super(message)
  }
}

export class ConfigurationError extends DomainError {
  readonly code = 'CONFIGURATION_ERROR'
}

/** Otra escritura modificó el documento entre la lectura y la escritura. */
export class VersionConflictError extends DomainError {
  readonly code = 'VERSION_CONFLICT'
}
