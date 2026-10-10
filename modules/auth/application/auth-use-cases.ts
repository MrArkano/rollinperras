import { createHash, timingSafeEqual } from 'node:crypto'
import { z } from 'zod'
import type { AdminSession, LoginAttemptLimiter, PasswordVerifier, SessionTokenService } from '../domain/ports'
import { UnauthorizedError, ValidationError } from '@/shared/domain/errors'
import { logger } from '@/shared/infrastructure/logger'

const credentialsSchema = z.object({ username: z.string().min(1).max(100), password: z.string().min(1).max(200) }).strict()

const digest = (value: string): Buffer => createHash('sha256').update(value).digest()

export interface AdminCredentials {
  readonly username: string
  readonly passwordHash: string
}

export class AuthenticateAdminUseCase {
  constructor(
    private readonly credentials: AdminCredentials,
    private readonly passwordVerifier: PasswordVerifier,
    private readonly tokens: SessionTokenService,
    private readonly limiter: LoginAttemptLimiter,
  ) {}

  /** Devuelve un token de sesión firmado o lanza `UnauthorizedError` con un mensaje genérico. */
  async execute(payload: unknown, clientKey: string): Promise<string> {
    this.limiter.assertAllowed(clientKey)

    const parsed = credentialsSchema.safeParse(payload)
    if (!parsed.success) throw new ValidationError('Usuario y contraseña son obligatorios')
    const { username, password } = parsed.data

    // Se evalúan siempre ambos factores para no revelar cuál falló (tiempo constante).
    const usernameMatches = timingSafeEqual(digest(username), digest(this.credentials.username))
    const passwordMatches = await this.passwordVerifier.verify(password, this.credentials.passwordHash)

    if (!usernameMatches || !passwordMatches) {
      this.limiter.recordFailure(clientKey)
      logger.warn('auth.login_failed', { clientKey })
      throw new UnauthorizedError('Credenciales incorrectas')
    }

    this.limiter.reset(clientKey)
    logger.info('auth.login_succeeded')
    return this.tokens.issue(this.credentials.username)
  }
}

export class VerifySessionUseCase {
  constructor(private readonly tokens: SessionTokenService) {}

  execute(token: string | undefined): AdminSession | null {
    return token ? this.tokens.verify(token) : null
  }
}
