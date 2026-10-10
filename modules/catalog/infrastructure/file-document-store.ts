import { createHash, randomUUID } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import type { DocumentStore, VersionedDocument } from './document-store'
import { VersionConflictError } from '@/shared/domain/errors'

const KEY_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/

const hash = (content: string): string => createHash('sha256').update(content).digest('hex')

function isMissingFile(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT'
}

/** Adaptador para servidores con disco persistente y para desarrollo local. */
export class FileDocumentStore implements DocumentStore {
  private readonly directory: string
  private queue: Promise<unknown> = Promise.resolve()

  constructor(dataDir: string) {
    this.directory = resolve(/* turbopackIgnore: true */ process.cwd(), dataDir)
  }

  private pathFor(key: string): string {
    if (!KEY_PATTERN.test(key)) throw new Error(`Clave de documento inválida: ${key}`)
    return join(this.directory, `${key}.json`)
  }

  /** Serializa las operaciones del proceso para que comparar-y-escribir sea atómico. */
  private exclusive<T>(task: () => Promise<T>): Promise<T> {
    const run = this.queue.then(task, task)
    this.queue = run.catch(() => undefined)
    return run
  }

  private async readUnlocked(key: string): Promise<VersionedDocument | null> {
    try {
      const content = await readFile(this.pathFor(key), 'utf8')
      return { content, version: hash(content) }
    } catch (error) {
      if (isMissingFile(error)) return null
      throw error
    }
  }

  read(key: string): Promise<VersionedDocument | null> {
    return this.readUnlocked(key)
  }

  write(key: string, content: string, expectedVersion: string | null): Promise<void> {
    return this.exclusive(async () => {
      const current = await this.readUnlocked(key)
      if ((current?.version ?? null) !== expectedVersion) {
        throw new VersionConflictError(`El documento "${key}" cambió durante la escritura`)
      }
      await mkdir(this.directory, { recursive: true })
      const target = this.pathFor(key)
      const temporary = `${target}.${randomUUID()}.tmp`
      await writeFile(temporary, content, 'utf8')
      await rename(temporary, target)
    })
  }
}
