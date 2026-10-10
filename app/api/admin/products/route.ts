import { requireAdminSession } from '@/lib/admin-session'
import { getCatalogContainer } from '@/lib/container'
import { assertSameOrigin, handleApiError, json, readJsonBody } from '@/shared/presentation/http'

export async function GET(): Promise<Response> {
  try {
    await requireAdminSession()
    return json(await getCatalogContainer().getCatalog.execute('admin'))
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOrigin(request)
    await requireAdminSession()
    const product = await getCatalogContainer().createProduct.execute(await readJsonBody(request))
    return json({ product }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
