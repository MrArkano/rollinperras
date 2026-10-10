import type { ReactNode } from 'react'

export const inputClass =
  'w-full rounded-xl border border-white/15 bg-black px-4 py-3 text-sm font-semibold text-[#E7DFD4] placeholder:text-white/35 outline-none transition focus:border-[#C4E76B] focus:ring-2 focus:ring-[#C4E76B]/30 aria-[invalid=true]:border-[#F54E95]'

export const primaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-full bg-[#C4E76B] px-6 py-3 text-xs font-black uppercase tracking-wider text-black transition hover:bg-[#E7DFD4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E7DFD4] disabled:cursor-not-allowed disabled:opacity-50'

export const ghostButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-full border border-white/25 px-5 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:border-[#C4E76B] hover:text-[#C4E76B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4E76B] disabled:cursor-not-allowed disabled:opacity-50'

interface FieldProps {
  readonly id: string
  readonly label: string
  readonly error?: string
  readonly hint?: string
  readonly children: ReactNode
}

/** Etiqueta + control + mensaje de error asociados (WCAG: label visible y aria-describedby en el control). */
export function Field({ id, label, error, hint, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-[11px] font-black uppercase tracking-[.2em] text-[#E7DFD4]/70">
        {label}
      </label>
      {children}
      {hint && !error && <p id={`${id}-hint`} className="mt-1.5 text-xs text-white/55">{hint}</p>}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs font-bold text-[#F54E95]">
          {error}
        </p>
      )}
    </div>
  )
}

export function BrandMark({ suffix }: { readonly suffix?: string }) {
  return (
    <span className="brand-mark font-display text-2xl uppercase text-[#C4E76B] md:text-3xl">
      ROLLIN’ <span className="text-[#E7DFD4]">PERRAS</span>
      {suffix && <span className="ml-3 inline-block -rotate-2 bg-[#F54E95] px-2 py-1 align-middle font-sans text-[10px] font-black tracking-[.2em] text-white [text-shadow:none]">{suffix}</span>}
    </span>
  )
}
