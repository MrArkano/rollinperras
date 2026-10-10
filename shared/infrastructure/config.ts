import { z } from 'zod'
import { ConfigurationError } from '@/shared/domain/errors'

const storageSchema = z.object({
  STORAGE_DRIVER: z.enum(['file', 'netlify-blobs']).optional(),
  DATA_DIR: z.string().trim().min(1).default('.data'),
})

const authSchema = z.object({
  ADMIN_USERNAME: z.string().trim().min(3),
  ADMIN_PASSWORD_HASH: z.string().trim().min(20),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET debe tener al menos 32 caracteres'),
  SESSION_TTL_HOURS: z.coerce.number().int().min(1).max(168).default(8),
})

export type StorageDriver = 'file' | 'netlify-blobs'

export interface StorageConfig {
  readonly driver: StorageDriver
  readonly dataDir: string
}

export interface AuthConfig {
  readonly username: string
  readonly passwordHash: string
  readonly sessionSecret: string
  readonly sessionTtlSeconds: number
}

function isNetlifyRuntime(env: NodeJS.ProcessEnv): boolean {
  return Boolean(env.NETLIFY || env.NETLIFY_BLOBS_CONTEXT || env.NETLIFY_LOCAL)
}

function formatIssues(error: z.ZodError): string {
  return error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ')
}

export function loadStorageConfig(env: NodeJS.ProcessEnv = process.env): StorageConfig {
  const parsed = storageSchema.safeParse(env)
  if (!parsed.success) throw new ConfigurationError(`Configuración de almacenamiento inválida (${formatIssues(parsed.error)})`)
  const driver = parsed.data.STORAGE_DRIVER ?? (isNetlifyRuntime(env) ? 'netlify-blobs' : 'file')
  return { driver, dataDir: parsed.data.DATA_DIR }
}

export function loadAuthConfig(env: NodeJS.ProcessEnv = process.env): AuthConfig {
  const parsed = authSchema.safeParse(env)
  if (!parsed.success) throw new ConfigurationError(`Configuración de administrador inválida (${formatIssues(parsed.error)})`)
  return {
    username: parsed.data.ADMIN_USERNAME,
    passwordHash: parsed.data.ADMIN_PASSWORD_HASH,
    sessionSecret: parsed.data.SESSION_SECRET,
    sessionTtlSeconds: parsed.data.SESSION_TTL_HOURS * 3600,
  }
}
