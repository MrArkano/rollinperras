import type { Catalog, Product } from '@/modules/catalog/domain/catalog'

export interface ProductPayload {
  name: string
  description: string
  category: string
  image: string
  price?: number
  sizes?: { label: string; price: number }[]
  tag?: string
  active: boolean
}

export interface FieldIssue {
  readonly path: string
  readonly message: string
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly issues: readonly FieldIssue[] = [],
  ) {
    super(message)
    this.name = 'ApiRequestError'
  }
}

interface ErrorEnvelope {
  error?: { code?: string; message?: string; issues?: FieldIssue[] }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(url, { ...init, cache: 'no-store', credentials: 'same-origin' })
  } catch {
    throw new ApiRequestError('No hay conexión con el servidor', 0, 'NETWORK_ERROR')
  }

  const body: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const envelope = (body ?? {}) as ErrorEnvelope
    throw new ApiRequestError(
      envelope.error?.message ?? 'Ocurrió un error inesperado',
      response.status,
      envelope.error?.code ?? 'UNKNOWN',
      envelope.error?.issues ?? [],
    )
  }
  return body as T
}

const jsonInit = (method: string, payload?: unknown): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: payload === undefined ? undefined : JSON.stringify(payload),
})

export const adminApi = {
  login: (username: string, password: string) => request<{ ok: true }>('/api/admin/login', jsonInit('POST', { username, password })),
  logout: () => request<{ ok: true }>('/api/admin/logout', jsonInit('POST')),
  getCatalog: () => request<Catalog>('/api/admin/products'),
  createProduct: (payload: ProductPayload) => request<{ product: Product }>('/api/admin/products', jsonInit('POST', payload)),
  updateProduct: (id: string, payload: ProductPayload) =>
    request<{ product: Product }>(`/api/admin/products/${encodeURIComponent(id)}`, jsonInit('PUT', payload)),
  deleteProduct: (id: string) => request<{ ok: true }>(`/api/admin/products/${encodeURIComponent(id)}`, jsonInit('DELETE')),
  uploadImage: async (file: Blob, fileName: string) => {
    const form = new FormData()
    form.append('file', file, fileName)
    return request<{ url: string }>('/api/admin/upload', { method: 'POST', body: form })
  },
}

export function toPayload(product: Product): ProductPayload {
  return {
    name: product.name,
    description: product.description,
    category: product.category,
    image: product.image,
    ...(product.sizes ? { sizes: product.sizes.map(({ label, price }) => ({ label, price })) } : { price: product.price }),
    ...(product.tag ? { tag: product.tag } : {}),
    active: product.active,
  }
}

const MAX_DIMENSION = 1600
const MAX_BYTES = 3.5 * 1024 * 1024

/** Reduce y comprime la imagen en el navegador (WebP) para respetar el límite de subida. */
export async function prepareImageForUpload(file: File): Promise<{ blob: Blob; fileName: string }> {
  const passthrough = { blob: file as Blob, fileName: file.name }
  if (file.type === 'image/gif') return passthrough

  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
    if (scale === 1 && file.size <= MAX_BYTES && file.type === 'image/webp') {
      bitmap.close()
      return passthrough
    }
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.86))
    return blob ? { blob, fileName: 'imagen.webp' } : passthrough
  } catch {
    return passthrough
  }
}
