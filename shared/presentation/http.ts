import {
  ConfigurationError,
  ConflictError,
  DomainError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
  UnauthorizedError,
  ValidationError,
} from '@/shared/domain/errors'
import { logger } from '@/shared/infrastructure/logger'

const MAX_JSON_BYTES = 64 * 1024

const NO_STORE = { 'Cache-Control': 'no-store' } as const

export function json(body: unknown, init: ResponseInit = {}): Response {
  return Response.json(body, { ...init, headers: { ...NO_STORE, ...init.headers } })
}

interface ErrorBody {
  readonly error: { readonly code: string; readonly message: string; readonly issues?: readonly { path: string; message: string }[] }
}

function errorResponse(status: number, code: string, message: string, extra?: Partial<ErrorBody['error']>, headers?: HeadersInit): Response {
  const body: ErrorBody = { error: { code, message, ...extra } }
  return json(body, { status, headers })
}

/** Manejo de errores centralizado: traduce errores de dominio a HTTP y registra los inesperados. */
export function handleApiError(error: unknown): Response {
  if (error instanceof ValidationError) return errorResponse(422, error.code, error.message, { issues: error.issues })
  if (error instanceof UnauthorizedError) return errorResponse(401, error.code, error.message)
  if (error instanceof ForbiddenError) return errorResponse(403, error.code, error.message)
  if (error instanceof NotFoundError) return errorResponse(404, error.code, error.message)
  if (error instanceof ConflictError) return errorResponse(409, error.code, error.message)
  if (error instanceof RateLimitError) {
    return errorResponse(429, error.code, error.message, undefined, { 'Retry-After': String(error.retryAfterSeconds) })
  }
  if (error instanceof ConfigurationError) {
    logger.error('http.configuration_error', error)
    return errorResponse(503, error.code, 'El servicio no está configurado correctamente')
  }
  if (error instanceof DomainError) {
    logger.error('http.unhandled_domain_error', error)
    return errorResponse(500, error.code, 'Error interno del servidor')
  }
  logger.error('http.unexpected_error', error)
  return errorResponse(500, 'INTERNAL_ERROR', 'Error interno del servidor')
}

/**
 * Defensa CSRF adicional a `SameSite=Strict`: las peticiones que modifican estado
 * deben provenir del mismo origen.
 */
export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get('origin')
  if (!origin) throw new ForbiddenError('Origen de la petición no permitido')

  let originHost: string
  try {
    originHost = new URL(origin).host
  } catch {
    throw new ForbiddenError('Origen de la petición no permitido')
  }

  const allowedHosts = [request.headers.get('host'), request.headers.get('x-forwarded-host'), new URL(request.url).host]
  if (!allowedHosts.includes(originHost)) throw new ForbiddenError('Origen de la petición no permitido')
}

export async function readJsonBody(request: Request): Promise<unknown> {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    throw new ValidationError('Content-Type debe ser application/json')
  }
  const declaredLength = Number(request.headers.get('content-length') ?? 0)
  if (declaredLength > MAX_JSON_BYTES) throw new ValidationError('El cuerpo de la petición es demasiado grande')

  const text = await request.text()
  if (text.length > MAX_JSON_BYTES) throw new ValidationError('El cuerpo de la petición es demasiado grande')
  try {
    return JSON.parse(text)
  } catch {
    throw new ValidationError('El cuerpo de la petición no es JSON válido')
  }
}

export function clientKeyFrom(request: Request): string {
  const forwarded = request.headers.get('x-nf-client-connection-ip') ?? request.headers.get('x-forwarded-for')
  return forwarded?.split(',')[0]?.trim() || 'unknown'
}
