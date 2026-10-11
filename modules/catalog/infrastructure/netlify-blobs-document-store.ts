import { getStore, type Store } from '@netlify/blobs'
import type { DocumentStore, VersionedDocument } from './document-store'
import { VersionConflictError } from '@/shared/domain/errors'

export const NETLIFY_STORE_NAME = 'rollin-perras'

export function openNetlifyStore(): Store {
  // En funciones serverless de Netlify no se debe forzar 'strong', ya que causa
  // BlobsConsistencyError al no disponer de uncachedEdgeURL. Se usa la configuración estándar.
  return getStore({ name: NETLIFY_STORE_NAME })
}

/** Adaptador para Netlify Blobs; usa ETags y escrituras condicionales para la concurrencia. */
export class NetlifyBlobsDocumentStore implements DocumentStore {
  private get store(): Store {
    return openNetlifyStore()
  }

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

