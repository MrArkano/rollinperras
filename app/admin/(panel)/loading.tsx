/** Skeleton mostrado mientras el servidor carga el catálogo del panel. */
export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-black" role="status" aria-label="Cargando panel">
      <div className="border-b border-white/10 px-5 py-5 lg:px-8">
        <div className="mx-auto h-9 max-w-7xl animate-pulse rounded-lg bg-white/10 sm:w-72" />
      </div>
      <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
        <div className="h-14 w-72 animate-pulse rounded-lg bg-white/10" />
        <div className="mt-10 grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-2xl bg-[#111111]" />
          ))}
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#111111]">
              <div className="aspect-[1.4] animate-pulse bg-[#222222]" />
              <div className="space-y-3 p-5">
                <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
                <div className="h-7 w-48 animate-pulse rounded bg-white/10" />
                <div className="h-10 animate-pulse rounded bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
