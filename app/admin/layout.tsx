import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Administración — Rollin’ Perras',
  description: 'Panel privado para administrar el menú de Rollin’ Perras.',
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <div className="min-h-screen bg-black text-[#E7DFD4]">{children}</div>
}
