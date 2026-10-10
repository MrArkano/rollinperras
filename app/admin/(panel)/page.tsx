import { redirect } from 'next/navigation'
import { AdminDashboard } from '@/components/admin/admin-dashboard'
import { AdminSetupNotice } from '@/components/admin/admin-setup-notice'
import { getAdminSession } from '@/lib/admin-session'
import { getCatalogContainer } from '@/lib/container'
import { ConfigurationError } from '@/shared/domain/errors'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  try {
    if (!(await getAdminSession())) redirect('/admin/login')
  } catch (error) {
    if (error instanceof ConfigurationError) return <AdminSetupNotice />
    throw error
  }

  const catalog = await getCatalogContainer().getCatalog.execute('admin')
  return <AdminDashboard initialCatalog={catalog} />
}
