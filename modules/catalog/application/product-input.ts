import { z } from 'zod'
import { MEDIA_FILE_NAME_PATTERN, MEDIA_URL_PREFIX } from '../domain/image-storage'
import { ValidationError } from '@/shared/domain/errors'

const MAX_PRICE = 10_000_000
// Rechaza caracteres de control (incluye saltos de línea y NUL) en campos de una sola línea.
const NO_CONTROL_CHARS = /^[^\u0000-\u001F\u007F]*$/

const singleLine = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min, `Debe tener al menos ${min} caracteres`)
    .max(max, `No puede superar ${max} caracteres`)
    .regex(NO_CONTROL_CHARS, 'Contiene caracteres no permitidos')

const price = z
  .number({ error: 'Escribe un precio válido' })
  .int('Debe ser un número entero')
  .min(0, 'No puede ser negativo')
  .max(MAX_PRICE, 'Precio demasiado alto')

function isAllowedImageReference(value: string): boolean {
  if (value.startsWith(MEDIA_URL_PREFIX)) return MEDIA_FILE_NAME_PATTERN.test(value.slice(MEDIA_URL_PREFIX.length))
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

const sizeSchema = z.object({ label: singleLine(1, 20), price }).strict()

export const productInputSchema = z
  .object({
    name: singleLine(2, 80),
    description: z.string().trim().min(1, 'Escribe una descripción').max(400, 'No puede superar 400 caracteres'),
    category: singleLine(2, 40),
    image: z
      .string()
      .trim()
      .max(600)
      .refine(isAllowedImageReference, 'Usa una imagen subida o una URL https válida'),
    price: price.optional(),
    sizes: z.array(sizeSchema).max(6, 'Máximo 6 tamaños').optional(),
    tag: singleLine(0, 24).optional(),
    active: z.boolean().default(true),
  })
  .strict()
  .superRefine((value, context) => {
    const hasSizes = (value.sizes?.length ?? 0) > 0
    const hasPrice = value.price !== undefined
    if (hasSizes === hasPrice) {
      context.addIssue({ code: 'custom', path: ['price'], message: 'Define un precio único o al menos un tamaño con precio' })
    }
    if (value.sizes) {
      const labels = value.sizes.map((size) => size.label.toLocaleLowerCase('es'))
      if (new Set(labels).size !== labels.length) {
        context.addIssue({ code: 'custom', path: ['sizes'], message: 'Los tamaños no pueden repetirse' })
      }
    }
  })

export type ProductInput = z.output<typeof productInputSchema>

/** Valida y normaliza un payload no confiable. Lanza `ValidationError` con el detalle por campo. */
export function parseProductInput(payload: unknown): ProductInput {
  const result = productInputSchema.safeParse(payload)
  if (!result.success) {
    throw new ValidationError(
      'Datos de producto inválidos',
      result.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
    )
  }
  return result.data
}
