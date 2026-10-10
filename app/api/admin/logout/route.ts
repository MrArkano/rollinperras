import { cookies } from 'next/headers'
import { SESSION_COOKIE_NAME, sessionCookieOptions } from '@/lib/admin-session'
import { assertSameOrigin, handleApiError, json } from '@/shared/presentation/http'

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOrigin(request)
    ;(await cookies()).set(SESSION_COOKIE_NAME, '', sessionCookieOptions(0))
    return json({ ok: true })
  } catch (error) {
    return handleApiError(error)
  }
}
