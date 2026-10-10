import { getCatalogContainer } from '@/lib/container'
import { handleApiError } from '@/shared/presentation/http'

interface RouteContext {
  readonly params: Promise<{ file: string }>
}

/** Sirve imágenes subidas desde el almacenamiento configurado. Los nombres son UUID inmutables. */
export async function GET(_request: Request, context: RouteContext): Promise<Response> {
  try {
    const { file } = await context.params
    const image = await getCatalogContainer().getImage.execute(file)
    return new Response(image.bytes as BodyInit, {
      headers: {
        'Content-Type': image.contentType,
        'Content-Length': String(image.bytes.byteLength),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'; sandbox",
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
