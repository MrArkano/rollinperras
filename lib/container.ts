import { AuthenticateAdminUseCase, VerifySessionUseCase } from '@/modules/auth/application/auth-use-cases'
import type { LoginAttemptLimiter } from '@/modules/auth/domain/ports'
import { HmacSessionTokenService } from '@/modules/auth/infrastructure/hmac-session-token-service'
import { InMemoryLoginAttemptLimiter } from '@/modules/auth/infrastructure/in-memory-login-attempt-limiter'
import { ScryptPasswordVerifier } from '@/modules/auth/infrastructure/scrypt-password'
import { GetImageUseCase, UploadImageUseCase } from '@/modules/catalog/application/image-use-cases'
import { CreateProductUseCase, DeleteProductUseCase, GetCatalogUseCase, UpdateProductUseCase } from '@/modules/catalog/application/product-use-cases'
import type { CatalogRepository } from '@/modules/catalog/domain/catalog-repository'
import type { ImageStorage } from '@/modules/catalog/domain/image-storage'
import { DocumentCatalogRepository } from '@/modules/catalog/infrastructure/document-catalog-repository'
import type { DocumentStore } from '@/modules/catalog/infrastructure/document-store'
import { FileDocumentStore } from '@/modules/catalog/infrastructure/file-document-store'
import { FileImageStorage } from '@/modules/catalog/infrastructure/file-image-storage'
import { NetlifyBlobsDocumentStore } from '@/modules/catalog/infrastructure/netlify-blobs-document-store'
import { NetlifyBlobsImageStorage } from '@/modules/catalog/infrastructure/netlify-blobs-image-storage'
import { loadAuthConfig, loadStorageConfig } from '@/shared/infrastructure/config'

/**
 * Raíz de composición: único lugar donde se eligen las implementaciones concretas.
 * Para migrar a SQL/NoSQL basta con implementar `CatalogRepository` y cambiarlo aquí.
 */
export interface CatalogContainer {
  readonly getCatalog: GetCatalogUseCase
  readonly createProduct: CreateProductUseCase
  readonly updateProduct: UpdateProductUseCase
  readonly deleteProduct: DeleteProductUseCase
  readonly uploadImage: UploadImageUseCase
  readonly getImage: GetImageUseCase
}

export interface AuthContainer {
  readonly authenticate: AuthenticateAdminUseCase
  readonly verifySession: VerifySessionUseCase
  readonly sessionTtlSeconds: number
}

interface Infrastructure {
  readonly repository: CatalogRepository
  readonly images: ImageStorage
}

function createInfrastructure(): Infrastructure {
  const config = loadStorageConfig()
  const store: DocumentStore = config.driver === 'netlify-blobs' ? new NetlifyBlobsDocumentStore() : new FileDocumentStore(config.dataDir)
  const images: ImageStorage = config.driver === 'netlify-blobs' ? new NetlifyBlobsImageStorage() : new FileImageStorage(config.dataDir)
  return { repository: new DocumentCatalogRepository(store), images }
}

function createCatalogContainer(): CatalogContainer {
  const { repository, images } = createInfrastructure()
  return {
    getCatalog: new GetCatalogUseCase(repository),
    createProduct: new CreateProductUseCase(repository),
    updateProduct: new UpdateProductUseCase(repository),
    deleteProduct: new DeleteProductUseCase(repository),
    uploadImage: new UploadImageUseCase(images),
    getImage: new GetImageUseCase(images),
  }
}

function createAuthContainer(limiter: LoginAttemptLimiter): AuthContainer {
  const config = loadAuthConfig()
  const tokens = new HmacSessionTokenService(config.sessionSecret, config.sessionTtlSeconds)
  return {
    authenticate: new AuthenticateAdminUseCase(
      { username: config.username, passwordHash: config.passwordHash },
      new ScryptPasswordVerifier(),
      tokens,
      limiter,
    ),
    verifySession: new VerifySessionUseCase(tokens),
    sessionTtlSeconds: config.sessionTtlSeconds,
  }
}

// Se cachea en globalThis para sobrevivir a la recarga de módulos en desarrollo
// (mantiene un único limitador y una única cola de escritura por proceso).
interface ContainerCache {
  catalog?: CatalogContainer
  auth?: AuthContainer
  limiter?: LoginAttemptLimiter
}

const globalCache = globalThis as typeof globalThis & { __rollinContainer?: ContainerCache }
const cache: ContainerCache = (globalCache.__rollinContainer ??= {})

export function getCatalogContainer(): CatalogContainer {
  return (cache.catalog ??= createCatalogContainer())
}

export function getAuthContainer(): AuthContainer {
  cache.limiter ??= new InMemoryLoginAttemptLimiter()
  return (cache.auth ??= createAuthContainer(cache.limiter))
}
