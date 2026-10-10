import { requireAdminSession } from '@/lib/admin-session'
import { getCatalogContainer } from '@/lib/container'
import { MAX_IMAGE_BYTES } from '@/modules/catalog/application/image-use-cases'
import { ValidationError } from '@/shared/domain/errors'
import { assertSameOrigin, handleApiError, json } from '@/shared/presentation/http'

// Margen para los encabezados multipart sobre el tamaño máximo de imagen.
const MAX_REQUEST_BYTES = MAX_IMAGE_BYTES + 64 * 1024

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOrigin(request)
    await requireAdminSession()

    if (Number(request.headers.get('content-length') ?? 0) > MAX_REQUEST_BYTES) {
      throw new ValidationError('La imagen es demasiado grande')
    }
    if (!request.headers.get('content-type')?.toLowerCase().startsWith('multipart/form-data')) {
      throw new ValidationError('Content-Type debe ser multipart/form-data')
    }

    const form = await request.formData()
    const file = form.get('file')
    if (!(file instanceof File)) throw new ValidationError('Adjunta un archivo en el campo "file"')
    if (file.size > MAX_IMAGE_BYTES) throw new ValidationError('La imagen es demasiado grande')

    const url = await getCatalogContainer().uploadImage.execute(new Uint8Array(await file.arrayBuffer()))
    return json({ url }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
