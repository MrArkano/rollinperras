import { redirect } from 'next/navigation'
import { AdminSetupNotice } from '@/components/admin/admin-setup-notice'
import { LoginForm } from '@/components/admin/login-form'
import { getAdminSession } from '@/lib/admin-session'
import { ConfigurationError } from '@/shared/domain/errors'

export const dynamic = 'force-dynamic'

export default async function AdminLoginPage() {
  try {
    if (await getAdminSession()) redirect('/admin')
  } catch (error) {
    if (error instanceof ConfigurationError) return <AdminSetupNotice />
    throw error
  }
  return <LoginForm />
}
