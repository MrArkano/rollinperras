import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto'
import type { PasswordVerifier } from '../domain/ports'

// Archivo autocontenido (solo `node:crypto`) para poder reutilizarlo desde scripts/hash-password.mjs.

const HASH_FORMAT = 'scrypt'
const KEY_LENGTH = 64
const DEFAULT_COST = 2 ** 17
const BLOCK_SIZE = 8
const PARALLELISM = 1
const MAX_COST = 2 ** 20

const deriveKey = (password: string, salt: Buffer, cost: number, blockSize: number, parallelism: number): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const options: ScryptOptions = { N: cost, r: blockSize, p: parallelism, maxmem: 256 * cost * blockSize + 1024 * 1024 }
    scrypt(password.normalize('NFKC'), salt, KEY_LENGTH, options, (error, key) => (error ? reject(error) : resolve(key)))
  })

/**
 * Formato (sin `$`, para que dotenv no lo interprete como variable):
 * `scrypt.<N>.<r>.<p>.<salt base64url>.<hash base64url>`
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const key = await deriveKey(password, salt, DEFAULT_COST, BLOCK_SIZE, PARALLELISM)
  return [HASH_FORMAT, DEFAULT_COST, BLOCK_SIZE, PARALLELISM, salt.toString('base64url'), key.toString('base64url')].join('.')
}

export class ScryptPasswordVerifier implements PasswordVerifier {
  async verify(password: string, storedHash: string): Promise<boolean> {
    const [format, cost, blockSize, parallelism, salt, expected] = storedHash.split('.')
    if (format !== HASH_FORMAT || !salt || !expected) return false

    const params = [Number(cost), Number(blockSize), Number(parallelism)]
    if (!params.every(Number.isInteger) || params.some((value) => value < 1) || params[0] > MAX_COST) return false

    const expectedKey = Buffer.from(expected, 'base64url')
    const actualKey = await deriveKey(password, Buffer.from(salt, 'base64url'), params[0], params[1], params[2])
    return expectedKey.length === actualKey.length && timingSafeEqual(expectedKey, actualKey)
  }
}
