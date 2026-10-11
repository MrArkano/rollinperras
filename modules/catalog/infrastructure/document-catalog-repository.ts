import { z } from 'zod'
import { reconcileCategories, type Catalog } from '../domain/catalog'
import type { CatalogRepository } from '../domain/catalog-repository'
import type { DocumentStore } from './document-store'
import { SEED_CATALOG } from './seed-catalog'
import { ConflictError, VersionConflictError } from '@/shared/domain/errors'
import { logger } from '@/shared/infrastructure/logger'

const CATALOG_KEY = 'catalog'
const MAX_WRITE_ATTEMPTS = 5

const sizeDocument = z.object({ label: z.string(), price: z.number() })
const catalogDocument = z.object({
  categories: z.array(z.string()),
  products: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      category: z.string(),
      image: z.string(),
      price: z.number().optional(),
      sizes: z.array(sizeDocument).optional(),
      tag: z.string().optional(),
      active: z.boolean().default(true),
    }),
  ),
})

function parseCatalog(content: string): Catalog {
  const parsed = catalogDocument.parse(JSON.parse(content))
  return { products: parsed.products, categories: reconcileCategories(parsed.categories, parsed.products) }
}

const serializeCatalog = (catalog: Catalog): string => JSON.stringify(catalog, null, 2)

const READ_TIMEOUT_MS = 2500

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)),
  ])
}

/** Repositorio del catálogo sobre cualquier `DocumentStore` (archivo, Netlify Blobs, ...). */
export class DocumentCatalogRepository implements CatalogRepository {
  constructor(private readonly store: DocumentStore) {}

  async load(): Promise<Catalog> {
    try {
      const document = await withTimeout(this.store.read(CATALOG_KEY), READ_TIMEOUT_MS)
      if (document) return parseCatalog(document.content)
      return await this.seed()
    } catch (error) {
      logger.error('catalog.load_failed_falling_back_to_seed', {
        error: error instanceof Error ? error.message : String(error),
      })
      return SEED_CATALOG
    }
  }

  async update(transform: (current: Catalog) => Catalog): Promise<Catalog> {
    for (let attempt = 1; attempt <= MAX_WRITE_ATTEMPTS; attempt += 1) {
      let document: { content: string; version: string } | null = null
      try {
        document = await withTimeout(this.store.read(CATALOG_KEY), READ_TIMEOUT_MS)
      } catch (readError) {
        logger.warn('catalog.read_before_update_failed', {
          error: readError instanceof Error ? readError.message : String(readError),
        })
      }
      const current = document ? parseCatalog(document.content) : SEED_CATALOG
      const next = transform(current)
      try {
        await this.store.write(CATALOG_KEY, serializeCatalog(next), document?.version ?? null)
        return next
      } catch (error) {
        if (!(error instanceof VersionConflictError)) throw error
        logger.warn('catalog.write_conflict', { attempt })
      }
    }
    throw new ConflictError('No se pudo guardar por escrituras simultáneas. Intenta de nuevo')
  }

  private async seed(): Promise<Catalog> {
    try {
      await withTimeout(this.store.write(CATALOG_KEY, serializeCatalog(SEED_CATALOG), null), READ_TIMEOUT_MS)
      logger.info('catalog.seeded', { products: SEED_CATALOG.products.length })
      return SEED_CATALOG
    } catch (error) {
      if (!(error instanceof VersionConflictError)) {
        logger.warn('catalog.seed_failed_using_seed', { error: error instanceof Error ? error.message : String(error) })
        return SEED_CATALOG
      }
      // Otra petición sembró el catálogo primero: leemos su versión.
      try {
        const document = await withTimeout(this.store.read(CATALOG_KEY), READ_TIMEOUT_MS)
        return document ? parseCatalog(document.content) : SEED_CATALOG
      } catch {
        return SEED_CATALOG
      }
    }
  }
}
