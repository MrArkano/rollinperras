'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { Loader2, Lock } from 'lucide-react'
import { ApiRequestError, adminApi } from './admin-api'
import { BrandMark, Field, inputClass, primaryButtonClass } from './ui'

export function LoginForm() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError('')
    try {
      await adminApi.login(username, password)
      router.replace('/admin')
      router.refresh()
    } catch (caught) {
      setError(caught instanceof ApiRequestError ? caught.message : 'No se pudo iniciar sesión')
      setPassword('')
      setPending(false)
    }
  }

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden px-5 py-16">
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute -left-24 top-16 h-[28rem] w-[28rem] rounded-full bg-[#C4E76B]/20 blur-[130px]" />
        <div className="absolute -right-10 bottom-0 h-[34rem] w-[34rem] rounded-full bg-[#F54E95]/20 blur-[150px]" />
      </div>

      <form onSubmit={submit} className="w-full max-w-md rounded-[2rem] border-2 border-[#C4E76B] bg-[#111111] p-8 shadow-[12px_14px_0_#F54E95]" aria-labelledby="login-title">
        <BrandMark suffix="ADMIN" />
        <h1 id="login-title" className="font-display mt-8 text-4xl font-black uppercase leading-none tracking-[-.05em]">
          Entra a la <span className="text-[#C4E76B]">cocina</span>
        </h1>
        <p className="mt-3 text-sm text-white/60">Panel para administrar productos, imágenes y descripciones del menú.</p>

        <div className="mt-8 space-y-5">
          <Field id="username" label="Usuario">
            <input id="username" name="username" autoComplete="username" required value={username} onChange={(event) => setUsername(event.target.value)} className={inputClass} />
          </Field>
          <Field id="password" label="Contraseña">
            <input id="password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} />
          </Field>
        </div>

        <p role="alert" className="mt-4 min-h-5 text-sm font-bold text-[#F54E95]">{error}</p>

        <button type="submit" disabled={pending} className={`${primaryButtonClass} mt-4 w-full py-4`}>
          {pending ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Lock size={16} aria-hidden />}
          {pending ? 'Verificando…' : 'Iniciar sesión'}
        </button>
      </form>
    </main>
  )
}
