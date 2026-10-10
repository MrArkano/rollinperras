'use client'

import { AlertDialog } from '@base-ui/react/alert-dialog'
import { Switch } from '@base-ui/react/switch'
import { Check, ExternalLink, Loader2, LogOut, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Catalog, Product } from '@/modules/catalog/domain/catalog'
import { ApiRequestError, adminApi, toPayload } from './admin-api'
import { ProductEditor } from './product-editor'
import { BrandMark, ghostButtonClass, inputClass, primaryButtonClass } from './ui'

type EditorTarget = { readonly mode: 'create' } | { readonly mode: 'edit'; readonly product: Product }

const money = (value: number) => `$${value.toLocaleString('es-CO')}`

function ProductCardImage({ src, alt }: { readonly src: string; readonly alt: string }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <div className={`relative aspect-[1.4] overflow-hidden bg-[#222222] ${loaded ? '' : 'animate-pulse'}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} loading="lazy" onLoad={() => setLoaded(true)} onError={() => setLoaded(true)} className={`h-full w-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`} />
    </div>
  )
}

function PriceSummary({ product }: { readonly product: Product }) {
  if (product.sizes && product.sizes.length > 0) {
    return (
      <p className="mt-1 text-xs font-bold text-white/65">
        {product.sizes.map((size) => `${size.label} ${money(size.price)}`).join(' · ')}
      </p>
    )
  }
  return <p className="mt-1 text-sm font-black text-[#E7DFD4]">{product.price === undefined ? '—' : money(product.price)}</p>
}

export function AdminDashboard({ initialCatalog }: { readonly initialCatalog: Catalog }) {
  const router = useRouter()
  const [catalog, setCatalog] = useState<Catalog>(initialCatalog)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Todas')
  const [editor, setEditor] = useState<EditorTarget | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [toast, setToast] = useState<{ readonly text: string; readonly tone: 'ok' | 'error' } | null>(null)

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 3200)
    return () => window.clearTimeout(timer)
  }, [toast])

  const goToLogin = useCallback(() => {
    router.replace('/admin/login')
    router.refresh()
  }, [router])

  const report = useCallback(
    (error: unknown) => {
      if (error instanceof ApiRequestError && error.status === 401) return goToLogin()
      setToast({ text: error instanceof ApiRequestError ? error.message : 'Ocurrió un error inesperado', tone: 'error' })
    },
    [goToLogin],
  )

  const reload = useCallback(async () => {
    setRefreshing(true)
    try {
      setCatalog(await adminApi.getCatalog())
    } catch (error) {
      report(error)
    } finally {
      setRefreshing(false)
    }
  }, [report])

  const chips = useMemo(() => ['Todas', ...catalog.categories], [catalog.categories])
  const selectedCategory = chips.includes(category) ? category : 'Todas'

  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('es')
    return catalog.products.filter(
      (product) =>
        (selectedCategory === 'Todas' || product.category === selectedCategory) &&
        (needle === '' || `${product.name} ${product.description} ${product.category}`.toLocaleLowerCase('es').includes(needle)),
    )
  }, [catalog.products, selectedCategory, query])

  const activeCount = useMemo(() => catalog.products.filter((product) => product.active).length, [catalog.products])

  async function toggleActive(product: Product, active: boolean) {
    setBusyId(product.id)
    try {
      await adminApi.updateProduct(product.id, { ...toPayload(product), active })
      await reload()
      setToast({ text: active ? `“${product.name}” ya es visible` : `“${product.name}” oculto del menú`, tone: 'ok' })
    } catch (error) {
      report(error)
    } finally {
      setBusyId(null)
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await adminApi.deleteProduct(pendingDelete.id)
      setToast({ text: `“${pendingDelete.name}” eliminado`, tone: 'ok' })
      setPendingDelete(null)
      await reload()
    } catch (error) {
      report(error)
    } finally {
      setDeleting(false)
    }
  }

  async function handleSaved(message: string) {
    setEditor(null)
    await reload()
    setToast({ text: message, tone: 'ok' })
  }

  async function logout() {
    try {
      await adminApi.logout()
    } finally {
      goToLogin()
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-black text-[#E7DFD4]">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <BrandMark suffix="ADMIN" />
          <nav aria-label="Acciones de administrador" className="flex items-center gap-2">
            <a href="/" target="_blank" rel="noopener noreferrer" className={`${ghostButtonClass} hidden sm:inline-flex`}>
              Ver sitio <ExternalLink size={14} aria-hidden />
            </a>
            <button type="button" onClick={logout} className={ghostButtonClass}>
              <LogOut size={14} aria-hidden /> Salir
            </button>
          </nav>
        </div>
      </header>

      <main className="relative isolate mx-auto max-w-7xl px-5 py-12 lg:px-8">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 overflow-hidden">
          <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-[#C4E76B]/15 blur-[120px]" />
          <div className="absolute right-0 top-10 h-96 w-96 rounded-full bg-[#F54E95]/15 blur-[140px]" />
        </div>

        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="mb-3 text-xs font-black uppercase tracking-[.25em] text-[#F54E95]">Panel de control</p>
            <h1 className="font-display text-5xl font-black uppercase leading-none tracking-[-.07em] md:text-6xl">
              Tu menú <span className="text-[#C4E76B]">perrón</span>
            </h1>
          </div>
          <button type="button" onClick={() => setEditor({ mode: 'create' })} className={`${primaryButtonClass} py-4`}>
            <Plus size={16} aria-hidden /> Nuevo producto
          </button>
        </div>

        <dl className="mt-10 grid grid-cols-3 gap-3">
          {[
            ['Productos', catalog.products.length],
            ['Visibles', activeCount],
            ['Categorías', catalog.categories.length],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-[#111111] p-4">
              <dt className="text-[11px] font-black uppercase tracking-[.2em] text-white/55">{label}</dt>
              <dd className="font-display mt-1 text-4xl leading-none text-[#C4E76B]">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-10 flex flex-col gap-4">
          <div className="relative max-w-md">
            <Search size={16} aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input type="search" aria-label="Buscar producto" placeholder="Buscar producto…" value={query} onChange={(event) => setQuery(event.target.value)} className={`${inputClass} pl-11`} />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none]" role="group" aria-label="Filtrar por categoría">
            {chips.map((chip) => (
              <button key={chip} type="button" aria-pressed={selectedCategory === chip} onClick={() => setCategory(chip)} className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-black uppercase tracking-wider transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4E76B] ${selectedCategory === chip ? 'border-[#C4E76B] bg-[#C4E76B] text-black' : 'border-white/15 text-white/65 hover:border-white/40 hover:text-white'}`}>
                {chip}
              </button>
            ))}
          </div>
        </div>

        <p className="sr-only" role="status" aria-live="polite">{visible.length} productos mostrados</p>

        <div className={`mt-6 grid gap-5 transition-opacity sm:grid-cols-2 lg:grid-cols-3 ${refreshing ? 'opacity-60' : 'opacity-100'}`} aria-busy={refreshing}>
          {visible.map((product) => (
            <article key={product.id} className={`group overflow-hidden rounded-[1.6rem] border bg-[#111111] transition hover:-translate-y-1 hover:border-[#C4E76B]/50 ${product.active ? 'border-white/10' : 'border-dashed border-white/20'}`}>
              <div className="relative">
                <ProductCardImage src={product.image} alt={product.name} />
                {!product.active && <span className="absolute left-4 top-4 rounded-full bg-black/80 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white/80">Oculto</span>}
                {product.tag && <span className="absolute right-4 top-4 rounded-full bg-[#F54E95] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white">{product.tag}</span>}
              </div>
              <div className="p-5">
                <p className="text-[11px] font-black uppercase tracking-[.2em] text-[#F54E95]">{product.category}</p>
                <h2 className="font-display mt-1 text-2xl font-black uppercase leading-none tracking-[-.04em] text-[#C4E76B]">{product.name}</h2>
                <PriceSummary product={product} />
                <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-relaxed text-white/60">{product.description}</p>

                <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                  <div className="flex items-center gap-2">
                    <Switch.Root checked={product.active} disabled={busyId === product.id} onCheckedChange={(active) => toggleActive(product, active)} aria-label={`Mostrar ${product.name} en la página`} className="relative h-6 w-11 shrink-0 rounded-full bg-white/20 transition data-[checked]:bg-[#C4E76B] data-[disabled]:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E7DFD4]">
                      <Switch.Thumb className="block h-4 w-4 translate-x-1 rounded-full bg-white transition-transform data-[checked]:translate-x-6 data-[checked]:bg-black" />
                    </Switch.Root>
                    <span className="text-[11px] font-black uppercase tracking-wider text-white/60">{product.active ? 'Visible' : 'Oculto'}</span>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setEditor({ mode: 'edit', product })} aria-label={`Editar ${product.name}`} className="rounded-full border border-white/20 p-2.5 text-white/80 transition hover:border-[#C4E76B] hover:text-[#C4E76B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4E76B]">
                      <Pencil size={15} aria-hidden />
                    </button>
                    <button type="button" onClick={() => setPendingDelete(product)} aria-label={`Eliminar ${product.name}`} className="rounded-full border border-white/20 p-2.5 text-white/80 transition hover:border-[#F54E95] hover:text-[#F54E95] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F54E95]">
                      <Trash2 size={15} aria-hidden />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {visible.length === 0 && (
          <div className="mt-6 rounded-[1.6rem] border border-dashed border-white/20 p-12 text-center text-white/60">
            <p className="font-display text-3xl uppercase">Nada por aquí</p>
            <p className="mt-2 text-sm">Cambia el filtro o agrega un producto nuevo.</p>
          </div>
        )}
      </main>

      {editor && (
        <ProductEditor
          product={editor.mode === 'edit' ? editor.product : null}
          categories={catalog.categories}
          onClose={() => setEditor(null)}
          onSaved={handleSaved}
          onUnauthorized={goToLogin}
        />
      )}

      <AlertDialog.Root open={pendingDelete !== null} onOpenChange={(open) => !open && !deleting && setPendingDelete(null)}>
        <AlertDialog.Portal>
          <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
          <AlertDialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2.5rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[2rem] border-2 border-[#F54E95] bg-[#111111] p-7 shadow-[10px_12px_0_#F54E95]/40 outline-none transition duration-200 data-[ending-style]:scale-95 data-[starting-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0">
            <AlertDialog.Title className="font-display text-3xl font-black uppercase leading-none tracking-[-.05em]">¿Eliminar producto?</AlertDialog.Title>
            <AlertDialog.Description className="mt-3 text-sm leading-relaxed text-white/65">
              “{pendingDelete?.name}” desaparecerá del menú de forma permanente. Si solo quieres ocultarlo, usa el interruptor de visibilidad.
            </AlertDialog.Description>
            <div className="mt-7 flex gap-3">
              <button type="button" onClick={confirmDelete} disabled={deleting} className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#F54E95] px-6 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-60">
                {deleting && <Loader2 size={15} className="animate-spin" aria-hidden />} Eliminar
              </button>
              <AlertDialog.Close disabled={deleting} className={ghostButtonClass}>Cancelar</AlertDialog.Close>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>

      {toast && (
        <div role="status" className={`fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-full px-5 py-3 text-xs font-black shadow-xl ${toast.tone === 'ok' ? 'bg-[#C4E76B] text-black' : 'bg-[#F54E95] text-white'}`}>
          {toast.tone === 'ok' && <Check size={16} aria-hidden />} {toast.text}
        </div>
      )}
    </div>
  )
}
