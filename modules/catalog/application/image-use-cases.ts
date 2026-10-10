import { randomUUID } from 'node:crypto'
import { detectImageType, MEDIA_FILE_NAME_PATTERN, MEDIA_URL_PREFIX, type ImageStorage, type StoredImage } from '../domain/image-storage'
import { NotFoundError, ValidationError } from '@/shared/domain/errors'

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024

export class UploadImageUseCase {
  constructor(private readonly storage: ImageStorage) {}

  /** Devuelve la URL pública (`/media/<uuid>.<ext>`) de la imagen almacenada. */
  async execute(bytes: Uint8Array): Promise<string> {
    if (bytes.byteLength === 0) throw new ValidationError('El archivo está vacío')
    if (bytes.byteLength > MAX_IMAGE_BYTES) {
      throw new ValidationError(`La imagen supera el máximo de ${MAX_IMAGE_BYTES / 1024 / 1024} MB`)
    }
    const detected = detectImageType(bytes)
    if (!detected) throw new ValidationError('Formato no soportado. Usa JPG, PNG, WebP o GIF')

    const fileName = `${randomUUID()}.${detected.extension}`
    await this.storage.save(fileName, { bytes, contentType: detected.contentType })
    return `${MEDIA_URL_PREFIX}${fileName}`
  }
}

export class GetImageUseCase {
  constructor(private readonly storage: ImageStorage) {}

  async execute(fileName: string): Promise<StoredImage> {
    // Whitelist estricta: evita path traversal y claves arbitrarias en el almacenamiento.
    if (!MEDIA_FILE_NAME_PATTERN.test(fileName)) throw new NotFoundError('Imagen no encontrada')
    const image = await this.storage.read(fileName)
    if (!image) throw new NotFoundError('Imagen no encontrada')
    return image
  }
}
