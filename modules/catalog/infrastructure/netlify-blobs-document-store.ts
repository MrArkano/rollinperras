import { getStore, type Store } from '@netlify/blobs'
import type { DocumentStore, VersionedDocument } from './document-store'
import { VersionConflictError } from '@/shared/domain/errors'

export const NETLIFY_STORE_NAME = 'rollin-perras'

export function openNetlifyStore(): Store {
  return getStore({ name: NETLIFY_STORE_NAME, consistency: 'strong' })
}

/** Adaptador para Netlify Blobs; usa ETags y escrituras condicionales para la concurrencia. */
export class NetlifyBlobsDocumentStore implements DocumentStore {
  constructor(private readonly store: Store = openNetlifyStore()) {}

  async read(key: string): Promise<VersionedDocument | null> {
    const entry = await this.store.getWithMetadata(`documents/${key}`, { type: 'text' })
    if (!entry?.etag) return null
    return { content: entry.data, version: entry.etag }
  }

  async write(key: string, content: string, expectedVersion: string | null): Promise<void> {
    const options = expectedVersion === null ? { onlyIfNew: true } : { onlyIfMatch: expectedVersion }
    const result = await this.store.set(`documents/${key}`, content, options)
    if (!result.modified) throw new VersionConflictError(`El documento "${key}" cambió durante la escritura`)
  }
}
