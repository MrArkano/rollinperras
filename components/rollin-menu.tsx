'use client'

import { useMemo, useState } from 'react'
import { Aladin } from 'next/font/google'
import { Check, ChevronDown, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import type { Product } from '@/modules/catalog/domain/catalog'

const aladin = Aladin({ subsets: ['latin'], weight: '400' })

type RollinMenuProps = {
  products: readonly Product[]
  categories: readonly string[]
}

type CartItem = {
  key: string
  name: string
  detail: string
  price: number
  quantity: number
}

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ''
const money = (value: number) => `$${value.toLocaleString('es-CO')}`

export default function RollinMenu({ products, categories: productCategories }: RollinMenuProps) {
  const categories = ['Todas', ...productCategories]
  const [activeCategory, setActiveCategory] = useState('Todas')
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [sizeChoice, setSizeChoice] = useState<Record<string, number>>({})
  const [heroSlide, setHeroSlide] = useState(0)
  const heroProducts = products.slice(0, 5)
  const heroProduct: Product | undefined = heroProducts[heroSlide]

  const visibleProducts = activeCategory === 'Todas' ? products : products.filter((product) => product.category === activeCategory)
  const total = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart])
  const count = cart.reduce((sum, item) => sum + item.quantity, 0)

  function addProduct(product: Product) {
    const sizeIndex = sizeChoice[product.id] ?? 0
    const size = product.sizes?.[sizeIndex]
    const price = size?.price ?? product.price ?? 0
    const detail = size ? size.label : ''
    const key = `${product.id}-${detail}`
    setCart((current) => {
      const existing = current.find((item) => item.key === key)
      if (existing) return current.map((item) => item.key === key ? { ...item, quantity: item.quantity + 1 } : item)
      return [...current, { key, name: product.name, detail, price, quantity: 1 }]
    })
    setToast(`${product.name} se sumó al pedido`)
    window.setTimeout(() => setToast(''), 2200)
  }

  function changeQuantity(key: string, change: number) {
    setCart((current) => current.flatMap((item) => item.key === key ? (item.quantity + change > 0 ? [{ ...item, quantity: item.quantity + change }] : []) : [item]))
  }

  function orderOnWhatsApp() {
    if (!cart.length) return
    if (!WHATSAPP_NUMBER) {
      setToast('Configura NEXT_PUBLIC_WHATSAPP_NUMBER para activar WhatsApp')
      window.setTimeout(() => setToast(''), 3200)
      return
    }
    const lines = cart.map((item, index) => `${index + 1}. ${item.name}${item.detail ? ` — ${item.detail}` : ''} — Cantidad: ${item.quantity} — ${money(item.price * item.quantity)}`)
    const message = `Hola, Rollin’ Perras. Quiero hacer el siguiente pedido:\n\n${lines.join('\n')}\n\nTotal de productos: ${money(total)}.\n\nNombre:\nDirección o modalidad de entrega:\nObservaciones:\n\nQuedo pendiente de la confirmación de mi pedido.`
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#000000] text-[#E7DFD4]">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#000000]/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <a href="#inicio" className={`${aladin.className} brand-mark text-3xl uppercase tracking-wide text-[#C4E76B]`}>ROLLIN’ <span className="text-[#E7DFD4]">PERRAS</span></a>
          <nav className="hidden items-center gap-8 text-xs font-bold uppercase tracking-[0.18em] text-[#E7DFD4]/70 md:flex"><a href="#menu" className="hover:text-[#C4E76B]">Menú</a><a href="#vibra" className="hover:text-[#C4E76B]">La vibra</a><a href="#contacto" className="hover:text-[#C4E76B]">Contacto</a></nav>
          <button onClick={() => setCartOpen(true)} className="relative rounded-full bg-[#C4E76B] p-3 text-[#000000] transition-transform hover:scale-105" aria-label="Abrir pedido"><ShoppingBag size={19} strokeWidth={2.5} />{count > 0 && <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#F54E95] text-[10px] font-black text-white">{count}</span>}</button>
        </div>
      </header>

      <main>
        <section id="inicio" className="relative isolate overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 -z-10 overflow-hidden bg-black/35 backdrop-blur-[2px]"><div className="absolute -left-24 top-24 h-[30rem] w-[30rem] rounded-full bg-[#C4E76B]/20 blur-[138px]" /><div className="absolute right-0 top-16 h-[42.5rem] w-[42.5rem] rounded-full bg-[#F54E95]/20 blur-[162px]" /><div className="absolute bottom-[-12.5rem] left-1/3 h-[30rem] w-[42.5rem] rounded-full bg-[#E7DFD4]/10 blur-[150px]" /></div>
          <div className="mx-auto grid min-h-[720px] w-full max-w-[1440px] items-center gap-10 px-8 py-20 lg:grid-cols-[.9fr_1.1fr] lg:px-12 lg:py-16">
            <div className="max-w-xl">
              <p className="mb-6 inline-flex -rotate-2 bg-[#F54E95] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white">Bucaramanga, Santander</p>
              <h1 className={`${aladin.className} text-[clamp(4.5rem,11vw,9.5rem)] uppercase leading-[.78] tracking-[-0.06em] text-[#C4E76B]`}>Cero<br /><span className="text-[#E7DFD4]">prejuicios.</span></h1>
              <p className="mt-8 max-w-md text-lg font-semibold leading-snug text-[#E7DFD4]/70">Pura perra vibra. <span className="text-[#C4E76B]">Las mejores perras de Bucaramanga</span> llegaron para quitarte el hambre y subirte el ánimo.</p>
              <div className="mt-9 flex flex-wrap gap-3"><a href="#menu" className="rounded-full bg-[#C4E76B] px-6 py-4 text-sm font-black uppercase tracking-wider text-[#000000] transition hover:bg-[#E7DFD4]">Ver el menú <span className="ml-2"></span></a><button onClick={() => setCartOpen(true)} className="rounded-full border border-white/25 px-6 py-4 text-sm font-black uppercase tracking-wider text-white transition hover:border-[#C4E76B] hover:text-[#C4E76B]">Arma tu pedido</button></div>
              <div className="mt-12 flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-white/40">Hecho para comer con las manos</div>
            </div>
            <div className="relative mx-auto w-full max-w-2xl">
              <div className="pointer-events-none absolute -inset-8 rounded-full bg-[#F54E95]/15 blur-3xl" />
              {heroProduct && <a href={`#producto-${heroProduct.id}`} className="relative block aspect-square overflow-hidden rounded-[2.5rem] border-8 border-[#C4E76B] bg-[#222222] shadow-[20px_25px_0_#F54E95] transition-transform duration-300 hover:scale-[1.02]">
                <img src={heroProduct.image} alt={heroProduct.name} className="h-full w-full object-cover" />
                <div className="absolute bottom-5 left-5 rounded-full bg-[#E7DFD4] px-4 py-2 text-xs font-black uppercase tracking-wider text-[#000000]">{heroProduct.name}</div>
              </a>}
              <div className="mt-7 flex items-center justify-center gap-2" aria-label="Productos destacados">
                {heroProducts.map((product, index) => <button key={product.id} onClick={() => setHeroSlide(index)} aria-label={`Ver ${product.name}`} className={`h-3 rounded-full transition-all ${index === heroSlide ? 'w-10 bg-[#F54E95]' : 'w-3 bg-[#E7DFD4]/40 hover:bg-[#C4E76B]'}`} />)}
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 bg-[#C4E76B] py-3 text-center text-xs font-black uppercase tracking-[.3em] text-[#000000]">Rollin’ Perras · Cero prejuicios · Pura perra vibra · Rollin’ Perras ·</div>
        </section>

        <section id="menu" className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
          <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><p className="mb-3 text-xs font-black uppercase tracking-[.25em] text-[#F54E95]">Elige tu mood</p><h2 className="font-display text-5xl font-black uppercase leading-none tracking-[-.07em] md:text-7xl">El menú <span className="text-[#C4E76B]">perrón</span></h2></div><p className="max-w-xs text-sm leading-relaxed text-white/50">Perras creativas, burgers brutales, panceta y bebidas para acompañar la vuelta.</p></div>
          <div className="mb-10 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">{categories.map((category) => <button key={category} onClick={() => setActiveCategory(category)} className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-black uppercase tracking-wider transition ${activeCategory === category ? 'border-[#C4E76B] bg-[#C4E76B] text-[#000000]' : 'border-white/15 text-white/60 hover:border-white/40 hover:text-white'}`}>{category}</button>)}</div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{visibleProducts.map((product) => <article id={`producto-${product.id}`} key={product.id} className="scroll-mt-28 group overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#111111] transition hover:-translate-y-1 hover:border-[#C4E76B]/50"><div className="relative aspect-[1.2] overflow-hidden"><img src={product.image} alt={product.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-[#000000]/70 via-transparent to-transparent" />{product.tag && <span className="absolute left-4 top-4 rounded-full bg-[#F54E95] px-3 py-1 text-[10px] font-black uppercase tracking-wider">{product.tag}</span>}</div><div className="p-5"><div className="flex items-start justify-between gap-4"><h3 className="font-display text-3xl font-black uppercase leading-none tracking-[-.05em] text-[#C4E76B]">{product.name}</h3>{product.price && <span className="shrink-0 text-lg font-black">{money(product.price)}</span>}</div><p className="mt-3 min-h-[52px] text-sm leading-relaxed text-white/55">{product.description}</p>{product.sizes && <div className="mt-4 flex gap-2">{product.sizes.map((size, index) => <button key={size.label} onClick={() => setSizeChoice((current) => ({ ...current, [product.id]: index }))} className={`flex-1 rounded-lg border px-2 py-2 text-xs font-bold transition ${((sizeChoice[product.id] ?? 0) === index) ? 'border-[#C4E76B] bg-[#C4E76B]/10 text-[#C4E76B]' : 'border-white/10 text-white/50'}`}><span>{size.label}</span><span className="ml-1">{money(size.price)}</span></button>)}</div>}<button onClick={() => addProduct(product)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#E7DFD4] py-3 text-xs font-black uppercase tracking-wider text-[#000000] transition hover:bg-[#C4E76B]"><Plus size={16} /> Agregar al pedido</button></div></article>)}</div>
        </section>

        <section id="vibra" className="border-y border-white/10 bg-[#F54E95] px-5 py-20 text-[#000000] lg:py-28"><div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.3fr_.7fr]"><div><p className="mb-4 text-xs font-black uppercase tracking-[.25em]">Nuestra única y exclusiva</p><h2 className="font-display max-w-4xl text-6xl font-black uppercase leading-[.8] tracking-[-.09em] md:text-9xl">Pura<br />perra<br /><span className="text-[#C4E76B]">vibra.</span></h2></div><div className="rounded-[2rem] border-2 border-[#000000] p-6"><p className="font-display text-3xl font-black uppercase leading-none">Entiende las perras vibras.</p><p className="mt-4 text-sm font-semibold leading-relaxed">Un sorbo y estás chill. Sodas frutales, ingredientes sin miedo y una actitud que no pide permiso.</p><a href="#menu" className="mt-6 inline-block rounded-full bg-[#000000] px-5 py-3 text-xs font-black uppercase tracking-wider text-[#E7DFD4]">Quiero una soda </a></div></div></section>

        <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28"><div className="grid gap-4 sm:grid-cols-3"><img src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=85" alt="Hamburguesa estilo smash" className="aspect-square w-full rounded-[1.5rem] object-cover sm:translate-y-8" /><img src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=85" alt="Comida a la parrilla" className="aspect-square w-full rounded-[1.5rem] object-cover" /><img src="https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=85" alt="Bebida frutal refrescante" className="aspect-square w-full rounded-[1.5rem] object-cover sm:translate-y-8" /></div></section>
      </main>

      <footer id="contacto" className="border-t border-white/10 px-5 py-12 lg:px-8"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 md:flex-row md:items-end"><div><div className="brand-mark font-display text-4xl font-black uppercase text-[#C4E76B]">ROLLIN’ PERRAS</div><p className="mt-2 text-sm text-white/50">Las mejores perras de Bucaramanga.</p></div><div className="text-left text-xs font-bold uppercase tracking-wider text-white/40 md:text-right"><p>Cero prejuicios, pura perra vibra</p><p className="mt-2">© {new Date().getFullYear()} Rollin’ Perras</p></div></div></footer>

      {toast && <div role="status" className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#C4E76B] px-5 py-3 text-xs font-black text-[#000000] shadow-xl"><Check size={16} /> {toast}</div>}
      <button onClick={() => setCartOpen(true)} className="fixed bottom-5 right-5 z-30 flex items-center gap-2 rounded-full bg-[#F54E95] px-5 py-4 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-black/30 transition hover:scale-105"><ShoppingBag size={17} /> Pedido {count > 0 && `(${count})`}</button>

      {cartOpen && <div className="fixed inset-0 z-50 flex justify-end bg-black/70" onClick={() => setCartOpen(false)}><aside className="flex h-full w-full max-w-md flex-col bg-[#111111] p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between border-b border-white/10 pb-5"><div><p className="text-xs font-black uppercase tracking-[.2em] text-[#F54E95]">Tu pedido</p><h2 className="font-display mt-1 text-4xl font-black uppercase leading-none">La perra orden</h2></div><button onClick={() => setCartOpen(false)} className="rounded-full border border-white/15 p-2 text-[#E7DFD4]/70 hover:text-white" aria-label="Cerrar carrito"><X size={20} /></button></div><div className="flex-1 overflow-y-auto py-6">{cart.length === 0 ? <div className="flex h-full flex-col items-center justify-center text-center text-white/40"><ShoppingBag size={40} className="mb-4" /><p className="font-display text-2xl font-black uppercase">Está vacío por ahora</p><p className="mt-2 text-sm">Agrega una perra y armamos la vuelta.</p></div> : <div className="space-y-4">{cart.map((item) => <div key={item.key} className="rounded-xl border border-white/10 bg-[#000000] p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-[#C4E76B]">{item.name}</h3>{item.detail && <p className="mt-1 text-xs text-white/50">{item.detail}</p>}</div><button onClick={() => setCart((current) => current.filter((entry) => entry.key !== item.key))} className="text-white/35 hover:text-[#F54E95]" aria-label={`Eliminar ${item.name}`}><Trash2 size={16} /></button></div><div className="mt-4 flex items-center justify-between"><div className="flex items-center gap-3 rounded-full border border-white/15 px-2 py-1"><button onClick={() => changeQuantity(item.key, -1)} aria-label="Disminuir cantidad"><Minus size={14} /></button><span className="w-5 text-center text-sm font-bold">{item.quantity}</span><button onClick={() => changeQuantity(item.key, 1)} aria-label="Aumentar cantidad"><Plus size={14} /></button></div><span className="font-black">{money(item.price * item.quantity)}</span></div></div>)}</div>}</div>{cart.length > 0 && <div className="border-t border-white/10 pt-5"><div className="mb-4 flex items-center justify-between text-lg font-black"><span>Total</span><span className="text-[#C4E76B]">{money(total)}</span></div><button onClick={orderOnWhatsApp} className="w-full rounded-xl bg-[#25d366] py-4 text-sm font-black uppercase tracking-wider text-[#000000] transition hover:brightness-110">Pedir por WhatsApp ↗</button><p className="mt-3 text-center text-[11px] leading-relaxed text-white/35">Completa tu nombre, dirección y observaciones en WhatsApp.</p></div>}</aside></div>}
    </div>
  )
}
