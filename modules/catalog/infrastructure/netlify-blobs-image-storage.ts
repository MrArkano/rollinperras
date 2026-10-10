import type { Store } from '@netlify/blobs'
import type { ImageContentType, ImageStorage, StoredImage } from '../domain/image-storage'
import { openNetlifyStore } from './netlify-blobs-document-store'

const CONTENT_TYPES: ReadonlySet<string> = new Set<ImageContentType>(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

const isImageContentType = (value: unknown): value is ImageContentType => typeof value === 'string' && CONTENT_TYPES.has(value)

export class NetlifyBlobsImageStorage implements ImageStorage {
  constructor(private readonly store: Store = openNetlifyStore()) {}

  async save(fileName: string, image: StoredImage): Promise<void> {
    const buffer = image.bytes.buffer.slice(image.bytes.byteOffset, image.bytes.byteOffset + image.bytes.byteLength) as ArrayBuffer
    await this.store.set(`media/${fileName}`, buffer, { metadata: { contentType: image.contentType }, onlyIfNew: true })
  }

  async read(fileName: string): Promise<StoredImage | null> {
    const entry = await this.store.getWithMetadata(`media/${fileName}`, { type: 'arrayBuffer' })
    const contentType = entry?.metadata.contentType
    if (!entry?.data || !isImageContentType(contentType)) return null
    return { bytes: new Uint8Array(entry.data), contentType }
  }
}
