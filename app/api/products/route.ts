import { getCatalogContainer } from '@/lib/container'
import { handleApiError, json } from '@/shared/presentation/http'

/** Catálogo público: solo productos activos. */
export async function GET(): Promise<Response> {
  try {
    const catalog = await getCatalogContainer().getCatalog.execute('public')
    return json(catalog, { headers: { 'Cache-Control': 'public, max-age=0, s-maxage=30, stale-while-revalidate=60' } })
  } catch (error) {
    return handleApiError(error)
  }
}
