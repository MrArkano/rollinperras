/**
 * Puerto de almacenamiento de documentos con control de concurrencia optimista.
 * `version` es un token opaco (hash o ETag) que cambia en cada escritura.
 */
export interface VersionedDocument {
  readonly content: string
  readonly version: string
}

export interface DocumentStore {
  read(key: string): Promise<VersionedDocument | null>
  /**
   * Escribe el documento solo si su versión actual coincide con `expectedVersion`
   * (`null` = el documento no debe existir). Lanza `VersionConflictError` si no coincide.
   */
  write(key: string, content: string, expectedVersion: string | null): Promise<void>
}
