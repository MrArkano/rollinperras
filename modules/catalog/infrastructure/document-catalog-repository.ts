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

/** Repositorio del catálogo sobre cualquier `DocumentStore` (archivo, Netlify Blobs, ...). */
export class DocumentCatalogRepository implements CatalogRepository {
  constructor(private readonly store: DocumentStore) {}

  async load(): Promise<Catalog> {
    const document = await this.store.read(CATALOG_KEY)
    if (document) return parseCatalog(document.content)
    return this.seed()
  }

  async update(transform: (current: Catalog) => Catalog): Promise<Catalog> {
    for (let attempt = 1; attempt <= MAX_WRITE_ATTEMPTS; attempt += 1) {
      const document = await this.store.read(CATALOG_KEY)
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
      await this.store.write(CATALOG_KEY, serializeCatalog(SEED_CATALOG), null)
      logger.info('catalog.seeded', { products: SEED_CATALOG.products.length })
      return SEED_CATALOG
    } catch (error) {
      if (!(error instanceof VersionConflictError)) throw error
      // Otra petición sembró el catálogo primero: leemos su versión.
      const document = await this.store.read(CATALOG_KEY)
      return document ? parseCatalog(document.content) : SEED_CATALOG
    }
  }
}
