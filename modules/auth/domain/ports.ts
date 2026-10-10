export interface AdminSession {
  readonly subject: string
  readonly expiresAt: number
}

/** Verifica una contraseña en claro contra un hash almacenado. */
export interface PasswordVerifier {
  verify(password: string, storedHash: string): Promise<boolean>
}

/** Emite y valida tokens de sesión firmados y con expiración. */
export interface SessionTokenService {
  issue(subject: string): string
  verify(token: string): AdminSession | null
}

/** Limita intentos de inicio de sesión fallidos por cliente. */
export interface LoginAttemptLimiter {
  /** Lanza `RateLimitError` si el cliente excedió el límite. */
  assertAllowed(clientKey: string): void
  recordFailure(clientKey: string): void
  reset(clientKey: string): void
}
