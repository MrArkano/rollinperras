import {
  addProduct,
  canonicalCategory,
  generateProductId,
  publicCatalog,
  removeProduct,
  replaceProduct,
  type Catalog,
  type Product,
} from '../domain/catalog'
import type { CatalogRepository } from '../domain/catalog-repository'
import { parseProductInput, type ProductInput } from './product-input'

function toProduct(id: string, input: ProductInput, categories: readonly string[]): Product {
  const sizes = input.sizes && input.sizes.length > 0 ? input.sizes.map(({ label, price }) => ({ label, price })) : undefined
  return {
    id,
    name: input.name,
    description: input.description,
    category: canonicalCategory(input.category, categories),
    image: input.image,
    ...(sizes ? { sizes } : { price: input.price }),
    ...(input.tag ? { tag: input.tag } : {}),
    active: input.active,
  }
}

/** Catálogo para la página pública (solo productos activos) o para el panel (todo). */
export class GetCatalogUseCase {
  constructor(private readonly repository: CatalogRepository) {}

  async execute(scope: 'public' | 'admin'): Promise<Catalog> {
    const catalog = await this.repository.load()
    return scope === 'public' ? publicCatalog(catalog) : catalog
  }
}

export class CreateProductUseCase {
  constructor(private readonly repository: CatalogRepository) {}

  async execute(payload: unknown): Promise<Product> {
    const input = parseProductInput(payload)
    let created: Product | undefined
    await this.repository.update((catalog) => {
      const ids = new Set(catalog.products.map((product) => product.id))
      const product = toProduct(generateProductId(input.name, ids), input, catalog.categories)
      created = product
      return addProduct(catalog, product)
    })
    if (!created) throw new Error('La transacción de creación no produjo un producto')
    return created
  }
}

export class UpdateProductUseCase {
  constructor(private readonly repository: CatalogRepository) {}

  async execute(id: string, payload: unknown): Promise<Product> {
    const input = parseProductInput(payload)
    let updated: Product | undefined
    await this.repository.update((catalog) => {
      const product = toProduct(id, input, catalog.categories)
      updated = product
      return replaceProduct(catalog, product)
    })
    if (!updated) throw new Error('La transacción de actualización no produjo un producto')
    return updated
  }
}

export class DeleteProductUseCase {
  constructor(private readonly repository: CatalogRepository) {}

  async execute(id: string): Promise<void> {
    await this.repository.update((catalog) => removeProduct(catalog, id))
  }
}
