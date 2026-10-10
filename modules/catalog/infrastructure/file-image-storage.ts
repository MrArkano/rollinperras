import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { MEDIA_FILE_NAME_PATTERN, type ImageContentType, type ImageStorage, type StoredImage } from '../domain/image-storage'

const CONTENT_TYPE_BY_EXTENSION: Readonly<Record<string, ImageContentType>> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
}

function isMissingFile(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT'
}

export class FileImageStorage implements ImageStorage {
  private readonly directory: string

  constructor(dataDir: string) {
    this.directory = resolve(/* turbopackIgnore: true */ process.cwd(), dataDir, 'media')
  }

  private pathFor(fileName: string): string {
    if (!MEDIA_FILE_NAME_PATTERN.test(fileName)) throw new Error(`Nombre de archivo inválido: ${fileName}`)
    return join(this.directory, fileName)
  }

  async save(fileName: string, image: StoredImage): Promise<void> {
    const target = this.pathFor(fileName)
    await mkdir(this.directory, { recursive: true })
    await writeFile(target, image.bytes, { flag: 'wx' })
  }

  async read(fileName: string): Promise<StoredImage | null> {
    try {
      const bytes = await readFile(this.pathFor(fileName))
      const contentType = CONTENT_TYPE_BY_EXTENSION[fileName.split('.').pop() ?? '']
      return contentType ? { bytes: new Uint8Array(bytes), contentType } : null
    } catch (error) {
      if (isMissingFile(error)) return null
      throw error
    }
  }
}
