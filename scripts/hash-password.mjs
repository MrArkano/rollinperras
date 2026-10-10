// Uso: npm run admin:hash -- "tu-contraseña"
// Imprime las variables de entorno necesarias para el panel de administrador.
import { randomBytes } from 'node:crypto'
import { hashPassword } from '../modules/auth/infrastructure/scrypt-password.ts'

const password = process.argv[2]

if (!password || password.length < 10) {
  console.error('Indica una contraseña de al menos 10 caracteres: npm run admin:hash -- "tu-contraseña"')
  process.exit(1)
}

const hash = await hashPassword(password)
console.log(`ADMIN_PASSWORD_HASH=${hash}`)
console.log(`SESSION_SECRET=${randomBytes(48).toString('base64url')}`)
