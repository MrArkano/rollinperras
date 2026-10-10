import { requireAdminSession } from '@/lib/admin-session'
import { getCatalogContainer } from '@/lib/container'
import { NotFoundError } from '@/shared/domain/errors'
import { assertSameOrigin, handleApiError, json, readJsonBody } from '@/shared/presentation/http'

const PRODUCT_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

interface RouteContext {
  readonly params: Promise<{ id: string }>
}

async function resolveId(context: RouteContext): Promise<string> {
  const { id } = await context.params
  if (id.length > 60 || !PRODUCT_ID_PATTERN.test(id)) throw new NotFoundError('Producto no encontrado')
  return id
}

export async function PUT(request: Request, context: RouteContext): Promise<Response> {
  try {
    assertSameOrigin(request)
    await requireAdminSession()
    const id = await resolveId(context)
    const product = await getCatalogContainer().updateProduct.execute(id, await readJsonBody(request))
    return json({ product })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: Request, context: RouteContext): Promise<Response> {
  try {
    assertSameOrigin(request)
    await requireAdminSession()
    await getCatalogContainer().deleteProduct.execute(await resolveId(context))
    return json({ ok: true })
  } catch (error) {
    return handleApiError(error)
  }
}
