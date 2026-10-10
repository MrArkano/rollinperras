import { ConflictError, NotFoundError } from '@/shared/domain/errors'

export interface ProductSize {
  readonly label: string
  readonly price: number
}

export interface Product {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly category: string
  readonly image: string
  /** Precio único. Mutuamente excluyente con `sizes`. */
  readonly price?: number
  readonly sizes?: readonly ProductSize[]
  readonly tag?: string
  /** Si es `false` el producto no se muestra en la página pública. */
  readonly active: boolean
}

export interface Catalog {
  readonly categories: readonly string[]
  readonly products: readonly Product[]
}

export const EMPTY_CATALOG: Catalog = { categories: [], products: [] }

export function slugify(text: string): string {
  const slug = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
  return slug || 'producto'
}

export function generateProductId(name: string, existingIds: ReadonlySet<string>): string {
  const base = slugify(name)
  if (!existingIds.has(base)) return base
  let suffix = 2
  while (existingIds.has(`${base}-${suffix}`)) suffix += 1
  return `${base}-${suffix}`
}

/** Devuelve la grafía ya existente de una categoría (sin distinguir mayúsculas) o la nueva tal cual. */
export function canonicalCategory(input: string, categories: readonly string[]): string {
  const lowered = input.toLocaleLowerCase('es')
  return categories.find((category) => category.toLocaleLowerCase('es') === lowered) ?? input
}

/**
 * Conserva el orden previo de las categorías con productos, elimina las vacías
 * y agrega al final las nuevas en el orden en que aparecen los productos. O(n).
 */
export function reconcileCategories(order: readonly string[], products: readonly Product[]): readonly string[] {
  const used = new Set(products.map((product) => product.category))
  const kept = order.filter((category) => used.has(category))
  const known = new Set(kept)
  const added = [...used].filter((category) => !known.has(category))
  return [...kept, ...added]
}

function withProducts(catalog: Catalog, products: readonly Product[]): Catalog {
  return { products, categories: reconcileCategories(catalog.categories, products) }
}

export function addProduct(catalog: Catalog, product: Product): Catalog {
  if (catalog.products.some((existing) => existing.id === product.id)) {
    throw new ConflictError(`Ya existe un producto con id "${product.id}"`)
  }
  return withProducts(catalog, [...catalog.products, product])
}

export function replaceProduct(catalog: Catalog, product: Product): Catalog {
  const index = catalog.products.findIndex((existing) => existing.id === product.id)
  if (index === -1) throw new NotFoundError(`Producto "${product.id}" no encontrado`)
  const products = catalog.products.map((existing, position) => (position === index ? product : existing))
  return withProducts(catalog, products)
}

export function removeProduct(catalog: Catalog, id: string): Catalog {
  const products = catalog.products.filter((existing) => existing.id !== id)
  if (products.length === catalog.products.length) throw new NotFoundError(`Producto "${id}" no encontrado`)
  return withProducts(catalog, products)
}

export function publicCatalog(catalog: Catalog): Catalog {
  return withProducts(catalog, catalog.products.filter((product) => product.active))
}
