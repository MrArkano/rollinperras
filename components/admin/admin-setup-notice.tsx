import { BrandMark } from './ui'

/** Se muestra cuando faltan las variables de entorno del administrador. */
export function AdminSetupNotice() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-16">
      <section className="w-full max-w-xl rounded-[2rem] border-2 border-[#F54E95] bg-[#111111] p-8" aria-labelledby="setup-title">
        <BrandMark suffix="ADMIN" />
        <h1 id="setup-title" className="font-display mt-8 text-4xl font-black uppercase leading-none tracking-[-.05em]">
          Falta <span className="text-[#C4E76B]">configurar</span>
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-white/70">
          Define estas variables de entorno y reinicia el servidor. Puedes generar el hash de la contraseña con{' '}
          <code className="rounded bg-black px-2 py-1 text-[#C4E76B]">npm run admin:hash -- &quot;tu-contraseña&quot;</code>.
        </p>
        <pre className="mt-5 overflow-x-auto rounded-xl bg-black p-4 text-xs leading-relaxed text-[#E7DFD4]">{`ADMIN_USERNAME=...
ADMIN_PASSWORD_HASH=...
SESSION_SECRET=... (mínimo 32 caracteres)`}</pre>
      </section>
    </main>
  )
}
