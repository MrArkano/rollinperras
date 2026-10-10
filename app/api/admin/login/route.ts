import { cookies } from 'next/headers'
import { getAuthContainer } from '@/lib/container'
import { SESSION_COOKIE_NAME, sessionCookieOptions } from '@/lib/admin-session'
import { assertSameOrigin, clientKeyFrom, handleApiError, json, readJsonBody } from '@/shared/presentation/http'

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOrigin(request)
    const auth = getAuthContainer()
    const token = await auth.authenticate.execute(await readJsonBody(request), clientKeyFrom(request))
    ;(await cookies()).set(SESSION_COOKIE_NAME, token, sessionCookieOptions(auth.sessionTtlSeconds))
    return json({ ok: true })
  } catch (error) {
    return handleApiError(error)
  }
}
