# Rollin’ Perras

Sitio del menú + backend + panel de administración (Next.js 16).

## Arranque local

```bash
npm install            # o pnpm install
cp .env.example .env.local   # ya existe uno de desarrollo
npm run dev
```

- Sitio: <http://localhost:3000>
- Panel: <http://localhost:3000/admin>

En local los datos se guardan en `.data/` (JSON + `media/`). Se crea solo, con el menú actual como semilla.

## Panel de administrador

Permite **editar nombre, descripción, categoría, etiqueta, precio/tamaños e imagen** de cada producto,
**agregar productos nuevos**, **ocultarlos** (sin borrarlos) y **eliminarlos**. Las imágenes se pueden
subir (se comprimen en el navegador) o enlazar por URL `https`.


## Despliegue en Netlify

1. Conecta el repositorio. Netlify detecta Next.js automáticamente.
2. En *Site configuration → Environment variables* define:
  
3. Productos e imágenes se guardan en **Netlify Blobs** (activado solo; no requiere base de datos).
   Opcional: fija `STORAGE_DRIVER=netlify-blobs` para hacerlo explícito.

## Arquitectura

```
modules/
  catalog/
    domain/          Product, Catalog (operaciones puras), puertos CatalogRepository e ImageStorage
    application/     Casos de uso + validación de entrada (zod)
    infrastructure/  DocumentStore (archivo | Netlify Blobs), DocumentCatalogRepository, semilla
  auth/
    domain/          Puertos: PasswordVerifier, SessionTokenService, LoginAttemptLimiter
    application/     Autenticación y verificación de sesión
    infrastructure/  scrypt, sesión firmada HMAC-SHA256, limitador de intentos
shared/              Errores de dominio, logger estructurado, config tipada, manejo HTTP central
lib/container.ts     Raíz de composición (inyección de dependencias)
app/                 Presentación: páginas, /api/*, /media/*
components/admin/    UI del panel
```

**Migrar a SQL/NoSQL:** implementa `CatalogRepository` (`load` + `update` transaccional) y cámbialo
en `lib/container.ts`. Los casos de uso y la UI no cambian.

### API

| Método | Ruta | Acceso |
| --- | --- | --- |
| GET | `/api/products` | Público (solo productos visibles) |
| GET / POST | `/api/admin/products` | Admin |
| PUT / DELETE | `/api/admin/products/:id` | Admin |
| POST | `/api/admin/upload` | Admin (multipart, JPG/PNG/WebP/GIF, ≤ 4 MB) |
| POST | `/api/admin/login`, `/api/admin/logout` | — |
| GET | `/media/:archivo` | Público (imágenes subidas) |

### Seguridad

- Validación estricta con zod en el borde (campos desconocidos rechazados, URLs de imagen solo `https` o subidas propias).
- Contraseña con **scrypt** (N=2¹⁷) + sal; comparación en tiempo constante; límite de intentos de login.
- Sesión: cookie `HttpOnly`, `Secure` (producción, prefijo `__Host-`), `SameSite=Strict`, firmada y con expiración.
- CSRF: `SameSite=Strict` + verificación de `Origin` en toda petición que modifica datos.
- Subidas: tipo real por *magic bytes* (SVG excluido), nombres UUID, límite de tamaño.
- Cabeceras: CSP, HSTS, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`.
- Concurrencia: escrituras con control optimista (ETag en Blobs, hash en archivo) y reintentos.
