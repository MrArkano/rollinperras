import { createHmac, timingSafeEqual } from 'node:crypto'
import type { AdminSession, SessionTokenService } from '../domain/ports'

interface TokenPayload {
  readonly sub: string
  readonly exp: number
}

function isTokenPayload(value: unknown): value is TokenPayload {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  return typeof candidate.sub === 'string' && typeof candidate.exp === 'number'
}

/** Token `base64url(payload).base64url(HMAC-SHA256)`. Sin estado en servidor. */
export class HmacSessionTokenService implements SessionTokenService {
  constructor(
    private readonly secret: string,
    private readonly ttlSeconds: number,
    private readonly now: () => number = Date.now,
  ) {}

  private sign(encodedPayload: string): Buffer {
    return createHmac('sha256', this.secret).update(encodedPayload).digest()
  }

  issue(subject: string): string {
    const payload: TokenPayload = { sub: subject, exp: this.now() + this.ttlSeconds * 1000 }
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
    return `${encodedPayload}.${this.sign(encodedPayload).toString('base64url')}`
  }

  verify(token: string): AdminSession | null {
    const [encodedPayload, encodedSignature, ...rest] = token.split('.')
    if (!encodedPayload || !encodedSignature || rest.length > 0) return null

    const expected = this.sign(encodedPayload)
    const received = Buffer.from(encodedSignature, 'base64url')
    if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null

    try {
      const payload: unknown = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'))
      if (!isTokenPayload(payload) || payload.exp <= this.now()) return null
      return { subject: payload.sub, expiresAt: payload.exp }
    } catch {
      return null
    }
  }
}
