import RollinMenu from '@/components/rollin-menu'
import { getCatalogContainer } from '@/lib/container'

export default async function Page() {
  const { products, categories } = await getCatalogContainer().getCatalog.execute('public')
  return <RollinMenu products={products} categories={categories} />
}

export const dynamic = 'force-dynamic'
