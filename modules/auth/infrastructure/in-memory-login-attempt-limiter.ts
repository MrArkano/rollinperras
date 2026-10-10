import type { LoginAttemptLimiter } from '../domain/ports'
import { RateLimitError } from '@/shared/domain/errors'

interface AttemptWindow {
  readonly failures: number
  readonly resetAt: number
}

/**
 * Limitador en memoria (ventana fija). En entornos serverless cada instancia
 * tiene su propio contador: es una defensa adicional, no la única (hash costoso + retardo).
 */
export class InMemoryLoginAttemptLimiter implements LoginAttemptLimiter {
  private readonly windows = new Map<string, AttemptWindow>()

  constructor(
    private readonly maxFailures = 5,
    private readonly windowMs = 15 * 60 * 1000,
    private readonly now: () => number = Date.now,
  ) {}

  private active(clientKey: string): AttemptWindow | undefined {
    const window = this.windows.get(clientKey)
    if (window && window.resetAt <= this.now()) {
      this.windows.delete(clientKey)
      return undefined
    }
    return window
  }

  assertAllowed(clientKey: string): void {
    const window = this.active(clientKey)
    if (window && window.failures >= this.maxFailures) {
      throw new RateLimitError('Demasiados intentos fallidos. Intenta más tarde', Math.ceil((window.resetAt - this.now()) / 1000))
    }
  }

  recordFailure(clientKey: string): void {
    const window = this.active(clientKey)
    this.windows.set(clientKey, {
      failures: (window?.failures ?? 0) + 1,
      resetAt: window?.resetAt ?? this.now() + this.windowMs,
    })
  }

  reset(clientKey: string): void {
    this.windows.delete(clientKey)
  }
}
