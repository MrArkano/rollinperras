import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { AdminSetupNotice } from '@/components/admin/admin-setup-notice'
import { getAdminSession } from '@/lib/admin-session'
import { ConfigurationError } from '@/shared/domain/errors'

export const dynamic = 'force-dynamic'

/**
 * Guardia del panel. Vive en el layout (por encima del skeleton `loading.tsx`) para que
 * las visitas sin sesión reciban una redirección HTTP real antes de transmitir contenido.
 */
export default async function PanelLayout({ children }: Readonly<{ children: ReactNode }>) {
  try {
    if (!(await getAdminSession())) redirect('/admin/login')
  } catch (error) {
    if (error instanceof ConfigurationError) return <AdminSetupNotice />
    throw error
  }
  return children
}
