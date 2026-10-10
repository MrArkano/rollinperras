'use client'

import { Dialog } from '@base-ui/react/dialog'
import { Switch } from '@base-ui/react/switch'
import { ImagePlus, Loader2, Plus, Trash2, X } from 'lucide-react'
import { useId, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import type { Product } from '@/modules/catalog/domain/catalog'
import { ApiRequestError, adminApi, prepareImageForUpload, type FieldIssue, type ProductPayload } from './admin-api'
import { Field, ghostButtonClass, inputClass, primaryButtonClass } from './ui'

interface SizeRow {
  readonly key: number
  readonly label: string
  readonly price: string
}

interface FormState {
  readonly name: string
  readonly description: string
  readonly category: string
  readonly tag: string
  readonly image: string
  readonly active: boolean
  readonly pricing: 'single' | 'sizes'
  readonly price: string
  readonly sizes: readonly SizeRow[]
}

export interface ProductEditorProps {
  readonly product: Product | null
  readonly categories: readonly string[]
  readonly onClose: () => void
  readonly onSaved: (message: string) => void
  readonly onUnauthorized: () => void
}

const money = (value: number) => `$${value.toLocaleString('es-CO')}`
const digitsOnly = (value: string) => value.replace(/\D/g, '')
const toAmount = (value: string): number | undefined => (value === '' ? undefined : Number(value))

function initialState(product: Product | null, nextKey: () => number): FormState {
  if (!product) {
    return { name: '', description: '', category: '', tag: '', image: '', active: true, pricing: 'single', price: '', sizes: [] }
  }
  const hasSizes = (product.sizes?.length ?? 0) > 0
  return {
    name: product.name,
    description: product.description,
    category: product.category,
    tag: product.tag ?? '',
    image: product.image,
    active: product.active,
    pricing: hasSizes ? 'sizes' : 'single',
    price: product.price === undefined ? '' : String(product.price),
    sizes: (product.sizes ?? []).map((size) => ({ key: nextKey(), label: size.label, price: String(size.price) })),
  }
}

function toRequest(state: FormState): ProductPayload {
  const base = {
    name: state.name,
    description: state.description,
    category: state.category,
    image: state.image,
    active: state.active,
    ...(state.tag.trim() ? { tag: state.tag } : {}),
  }
  if (state.pricing === 'single') return { ...base, price: toAmount(state.price) }
  return { ...base, sizes: state.sizes.map((size) => ({ label: size.label, price: toAmount(size.price) ?? Number.NaN })) }
}

function groupIssues(issues: readonly FieldIssue[]): Readonly<Record<string, string>> {
  return Object.fromEntries(issues.map((issue) => [issue.path, issue.message]))
}

export function ProductEditor({ product, categories, onClose, onSaved, onUnauthorized }: ProductEditorProps) {
  const formId = useId()
  const keyCounter = useRef(0)
  const nextKey = () => (keyCounter.current += 1)
  const fileInput = useRef<HTMLInputElement>(null)

  const [state, setState] = useState<FormState>(() => initialState(product, nextKey))
  const [errors, setErrors] = useState<Readonly<Record<string, string>>>({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const patch = (changes: Partial<FormState>) => setState((current) => ({ ...current, ...changes }))
  const updateSize = (key: number, changes: Partial<SizeRow>) =>
    setState((current) => ({ ...current, sizes: current.sizes.map((size) => (size.key === key ? { ...size, ...changes } : size)) }))

  function handleFailure(error: unknown) {
    if (error instanceof ApiRequestError) {
      if (error.status === 401) return onUnauthorized()
      setErrors(groupIssues(error.issues))
      setFormError(error.issues.length > 0 ? 'Revisa los campos marcados.' : error.message)
      return
    }
    setFormError('Ocurrió un error inesperado')
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setUploading(true)
    setErrors((current) => ({ ...current, image: '' }))
    try {
      const { blob, fileName } = await prepareImageForUpload(file)
      const { url } = await adminApi.uploadImage(blob, fileName)
      patch({ image: url })
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 401) return onUnauthorized()
      setErrors((current) => ({ ...current, image: error instanceof ApiRequestError ? error.message : 'No se pudo subir la imagen' }))
    } finally {
      setUploading(false)
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setErrors({})
    setFormError('')
    try {
      const payload = toRequest(state)
      if (product) await adminApi.updateProduct(product.id, payload)
      else await adminApi.createProduct(payload)
      onSaved(product ? `“${state.name.trim()}” actualizado` : `“${state.name.trim()}” agregado al menú`)
    } catch (error) {
      handleFailure(error)
      setSaving(false)
    }
  }

  const describedBy = (field: string) => (errors[field] ? `${formId}-${field}-error` : undefined)
  const previewable = state.image.startsWith('/media/') || state.image.startsWith('https://')

  return (
    <Dialog.Root open onOpenChange={(open) => !open && !saving && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l-2 border-[#C4E76B] bg-[#111111] shadow-2xl outline-none transition-transform duration-300 data-[ending-style]:translate-x-full data-[starting-style]:translate-x-full">
          <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[.25em] text-[#F54E95]">{product ? 'Editar producto' : 'Nuevo producto'}</p>
              <Dialog.Title className="font-display mt-1 text-3xl font-black uppercase leading-none tracking-[-.05em]">
                {product ? product.name : 'Suma una perra'}
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-xs text-white/60">Los cambios se publican en la página al guardar.</Dialog.Description>
            </div>
            <Dialog.Close aria-label="Cerrar editor" className="rounded-full border border-white/15 p-2 text-[#E7DFD4]/70 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4E76B]">
              <X size={18} aria-hidden />
            </Dialog.Close>
          </div>

          <form id={formId} onSubmit={submit} noValidate className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
            <fieldset>
              <legend className="mb-2 block text-[11px] font-black uppercase tracking-[.2em] text-[#E7DFD4]/70">Imagen</legend>
              <div className="relative aspect-[1.6] overflow-hidden rounded-2xl border border-white/10 bg-black">
                {previewable ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={state.image} alt={`Vista previa de ${state.name || 'producto'}`} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-white/40">
                    <ImagePlus size={32} aria-hidden />
                    <span className="text-xs font-bold uppercase tracking-wider">Sin imagen</span>
                  </div>
                )}
                {uploading && (
                  <div role="status" className="absolute inset-0 flex animate-pulse items-center justify-center gap-2 bg-black/70 text-xs font-black uppercase tracking-wider text-[#C4E76B]">
                    <Loader2 size={18} className="animate-spin" aria-hidden /> Subiendo imagen…
                  </div>
                )}
              </div>
              <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleFile} className="sr-only" tabIndex={-1} aria-label="Seleccionar archivo de imagen" />
              <div className="mt-3 flex flex-wrap gap-3">
                <button type="button" onClick={() => fileInput.current?.click()} disabled={uploading} className={ghostButtonClass}>
                  <ImagePlus size={15} aria-hidden /> Subir imagen
                </button>
              </div>
              <div className="mt-3">
                <Field id={`${formId}-image`} label="o pega una URL https" error={errors.image}>
                  <input id={`${formId}-image`} type="url" inputMode="url" placeholder="https://…" value={state.image.startsWith('/media/') ? '' : state.image} onChange={(event) => patch({ image: event.target.value })} aria-invalid={Boolean(errors.image)} aria-describedby={describedBy('image')} className={inputClass} />
                </Field>
              </div>
            </fieldset>

            <Field id={`${formId}-name`} label="Nombre" error={errors.name}>
              <input id={`${formId}-name`} value={state.name} onChange={(event) => patch({ name: event.target.value })} maxLength={80} required aria-invalid={Boolean(errors.name)} aria-describedby={describedBy('name')} className={inputClass} />
            </Field>

            <Field id={`${formId}-description`} label="Descripción" error={errors.description} hint={`${state.description.length}/400`}>
              <textarea id={`${formId}-description`} rows={4} value={state.description} onChange={(event) => patch({ description: event.target.value })} maxLength={400} required aria-invalid={Boolean(errors.description)} aria-describedby={describedBy('description')} className={`${inputClass} resize-y leading-relaxed`} />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field id={`${formId}-category`} label="Categoría" error={errors.category}>
                <input id={`${formId}-category`} list={`${formId}-categories`} value={state.category} onChange={(event) => patch({ category: event.target.value })} maxLength={40} required placeholder="Elige o escribe una nueva" aria-invalid={Boolean(errors.category)} aria-describedby={describedBy('category')} className={inputClass} />
                <datalist id={`${formId}-categories`}>
                  {categories.map((category) => (
                    <option key={category} value={category} />
                  ))}
                </datalist>
              </Field>
              <Field id={`${formId}-tag`} label="Etiqueta (opcional)" error={errors.tag}>
                <input id={`${formId}-tag`} value={state.tag} onChange={(event) => patch({ tag: event.target.value })} maxLength={24} placeholder="Nueva, Favorita…" aria-invalid={Boolean(errors.tag)} aria-describedby={describedBy('tag')} className={inputClass} />
              </Field>
            </div>

            <fieldset>
              <legend className="mb-2 block text-[11px] font-black uppercase tracking-[.2em] text-[#E7DFD4]/70">Precio</legend>
              <div className="inline-flex rounded-full border border-white/15 p-1" role="radiogroup" aria-label="Tipo de precio">
                {(['single', 'sizes'] as const).map((mode) => (
                  <button key={mode} type="button" role="radio" aria-checked={state.pricing === mode} onClick={() => patch({ pricing: mode, ...(mode === 'sizes' && state.sizes.length === 0 ? { sizes: [{ key: nextKey(), label: '', price: '' }] } : {}) })} className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-wider transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4E76B] ${state.pricing === mode ? 'bg-[#C4E76B] text-black' : 'text-white/60 hover:text-white'}`}>
                    {mode === 'single' ? 'Precio único' : 'Por tamaños'}
                  </button>
                ))}
              </div>

              {state.pricing === 'single' ? (
                <div className="mt-4">
                  <Field id={`${formId}-price`} label="Valor (COP)" error={errors.price} hint={state.price ? money(Number(state.price)) : 'Solo números, sin puntos'}>
                    <input id={`${formId}-price`} inputMode="numeric" value={state.price} onChange={(event) => patch({ price: digitsOnly(event.target.value) })} placeholder="26900" aria-invalid={Boolean(errors.price)} aria-describedby={describedBy('price')} className={inputClass} />
                  </Field>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {state.sizes.map((size, index) => (
                    <div key={size.key} className="grid grid-cols-[1fr_1fr_auto] items-end gap-3">
                      <Field id={`${formId}-size-label-${size.key}`} label={`Tamaño ${index + 1}`} error={errors[`sizes.${index}.label`]}>
                        <input id={`${formId}-size-label-${size.key}`} value={size.label} onChange={(event) => updateSize(size.key, { label: event.target.value })} maxLength={20} placeholder="17 cm" aria-invalid={Boolean(errors[`sizes.${index}.label`])} className={inputClass} />
                      </Field>
                      <Field id={`${formId}-size-price-${size.key}`} label="Valor (COP)" error={errors[`sizes.${index}.price`]}>
                        <input id={`${formId}-size-price-${size.key}`} inputMode="numeric" value={size.price} onChange={(event) => updateSize(size.key, { price: digitsOnly(event.target.value) })} placeholder="24900" aria-invalid={Boolean(errors[`sizes.${index}.price`])} className={inputClass} />
                      </Field>
                      <button type="button" aria-label={`Quitar tamaño ${index + 1}`} onClick={() => patch({ sizes: state.sizes.filter((row) => row.key !== size.key) })} className="mb-1 rounded-full border border-white/15 p-3 text-white/60 transition hover:border-[#F54E95] hover:text-[#F54E95] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F54E95]">
                        <Trash2 size={15} aria-hidden />
                      </button>
                    </div>
                  ))}
                  {errors.sizes && <p role="alert" className="text-xs font-bold text-[#F54E95]">{errors.sizes}</p>}
                  {errors.price && <p role="alert" className="text-xs font-bold text-[#F54E95]">{errors.price}</p>}
                  {state.sizes.length < 6 && (
                    <button type="button" onClick={() => patch({ sizes: [...state.sizes, { key: nextKey(), label: '', price: '' }] })} className={ghostButtonClass}>
                      <Plus size={15} aria-hidden /> Agregar tamaño
                    </button>
                  )}
                </div>
              )}
            </fieldset>

            <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black p-4">
              <div>
                <p id={`${formId}-active-label`} className="text-sm font-black uppercase tracking-wider">Visible en la página</p>
                <p className="mt-1 text-xs text-white/55">Desactívalo para ocultarlo sin borrarlo.</p>
              </div>
              <Switch.Root checked={state.active} onCheckedChange={(active) => patch({ active })} aria-labelledby={`${formId}-active-label`} className="relative h-7 w-12 shrink-0 rounded-full bg-white/20 transition data-[checked]:bg-[#C4E76B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E7DFD4]">
                <Switch.Thumb className="block h-5 w-5 translate-x-1 rounded-full bg-white transition-transform data-[checked]:translate-x-6 data-[checked]:bg-black" />
              </Switch.Root>
            </div>
          </form>

          <div className="border-t border-white/10 px-6 py-4">
            <p role="alert" className="mb-3 min-h-4 text-xs font-bold text-[#F54E95]">{formError}</p>
            <div className="flex gap-3">
              <button type="submit" form={formId} disabled={saving || uploading} className={`${primaryButtonClass} flex-1`}>
                {saving && <Loader2 size={15} className="animate-spin" aria-hidden />}
                {saving ? 'Guardando…' : product ? 'Guardar cambios' : 'Agregar al menú'}
              </button>
              <button type="button" onClick={onClose} disabled={saving} className={ghostButtonClass}>Cancelar</button>
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
