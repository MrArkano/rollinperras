import type { Catalog } from './catalog'

/**
 * Puerto de persistencia del catálogo. Agnóstico del motor (archivo, blobs, SQL, NoSQL):
 * una migración solo requiere una nueva implementación de esta interfaz.
 */
export interface CatalogRepository {
  /** Devuelve el catálogo actual (siembra los datos iniciales la primera vez). */
  load(): Promise<Catalog>

  /**
   * Lectura-modificación-escritura atómica (transacción). `transform` debe ser pura,
   * porque la implementación puede reintentarla ante escrituras concurrentes.
   */
  update(transform: (current: Catalog) => Catalog): Promise<Catalog>
}
