import { cookies } from 'next/headers'
import { getAuthContainer } from '@/lib/container'
import type { AdminSession } from '@/modules/auth/domain/ports'
import { UnauthorizedError } from '@/shared/domain/errors'

const isProduction = process.env.NODE_ENV === 'production'

/** Con el prefijo `__Host-` el navegador exige Secure, Path=/ y prohíbe Domain. */
export const SESSION_COOKIE_NAME = isProduction ? '__Host-rollin_session' : 'rollin_session'

export function sessionCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/',
    maxAge: maxAgeSeconds,
  } as const
}

/** Sesión de administrador actual o `null`. Úsala en páginas del servidor. */
export async function getAdminSession(): Promise<AdminSession | null> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value
  return getAuthContainer().verifySession.execute(token)
}

/** Para route handlers: lanza `UnauthorizedError` si no hay sesión válida. */
export async function requireAdminSession(): Promise<AdminSession> {
  const session = await getAdminSession()
  if (!session) throw new UnauthorizedError('Inicia sesión para continuar')
  return session
}
