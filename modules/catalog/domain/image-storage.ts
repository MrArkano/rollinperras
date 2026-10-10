export type ImageContentType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'

export interface StoredImage {
  readonly bytes: Uint8Array
  readonly contentType: ImageContentType
}

/** Puerto de almacenamiento de imágenes subidas. */
export interface ImageStorage {
  save(fileName: string, image: StoredImage): Promise<void>
  read(fileName: string): Promise<StoredImage | null>
}

export interface DetectedImageType {
  readonly contentType: ImageContentType
  readonly extension: 'jpg' | 'png' | 'webp' | 'gif'
}

const startsWith = (bytes: Uint8Array, signature: readonly number[], offset = 0): boolean =>
  signature.every((value, index) => bytes[offset + index] === value)

/**
 * Detecta el tipo real por los "magic bytes" (no confía en el Content-Type del cliente).
 * SVG queda deliberadamente excluido: puede contener scripts (XSS).
 */
export function detectImageType(bytes: Uint8Array): DetectedImageType | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return { contentType: 'image/jpeg', extension: 'jpg' }
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { contentType: 'image/png', extension: 'png' }
  if (startsWith(bytes, [0x47, 0x49, 0x46, 0x38]) && (bytes[4] === 0x37 || bytes[4] === 0x39) && bytes[5] === 0x61) {
    return { contentType: 'image/gif', extension: 'gif' }
  }
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)) {
    return { contentType: 'image/webp', extension: 'webp' }
  }
  return null
}

export const MEDIA_FILE_NAME_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|gif)$/
export const MEDIA_URL_PREFIX = '/media/'
