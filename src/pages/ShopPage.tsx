import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { shopApi } from '../api/shop'
import type { ProductSort } from '../api/types'
import { ProductGrid } from '../components/ProductCard'
import { Button, ErrorBanner, Spinner } from '../components/ui'

const sorts: { value: ProductSort; label: string }[] = [
  { value: 'POPULAR', label: 'Popular' },
  { value: 'PRICE_ASC', label: 'Price: Low' },
  { value: 'PRICE_DESC', label: 'Price: High' },
  { value: 'NEWEST', label: 'Newest' },
]

/** Filters live in the URL (?category=&q=&sort=&deals=1&page=), so links and the back button keep them. */
export function ShopPage() {
  const [params, setParams] = useSearchParams()
  const category = params.get('category') ?? ''
  const q = params.get('q') ?? ''
  const sort = (params.get('sort') as ProductSort | null) ?? 'POPULAR'
  const deals = params.get('deals') === '1'
  const page = Number(params.get('page') ?? 0)

  const update = useCallback(
    (changes: Record<string, string>) =>
      setParams(
        (previous) => {
          const next = new URLSearchParams(previous)
          for (const [key, value] of Object.entries(changes)) {
            if (value) next.set(key, value)
            else next.delete(key)
          }
          if (!('page' in changes)) next.delete('page')
          return next
        },
        { replace: true },
      ),
    [setParams],
  )

  // The search box follows the URL (header search, back button) and updates it as you type.
  const [search, setSearch] = useState(q)
  const [syncedQ, setSyncedQ] = useState(q)
  if (q !== syncedQ) {
    setSyncedQ(q)
    setSearch(q)
  }
  useEffect(() => {
    if (search === q) return
    const timer = setTimeout(() => update({ q: search.trim() }), 300)
    return () => clearTimeout(timer)
  }, [search, q, update])

  const categories = useQuery({ queryKey: ['categories'], queryFn: shopApi.categories })
  const products = useQuery({
    queryKey: ['products', { category, q, sort, deals, page }],
    queryFn: () => shopApi.products({ category: category || undefined, q: q || undefined, sort, deals, page }),
    placeholderData: keepPreviousData,
  })

  const chip = (active: boolean) =>
    `shrink-0 rounded-full px-3 py-1.5 text-sm ${active ? 'bg-brand text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'}`
  const data = products.data

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Shop</h1>
      <input
        className="input max-w-lg"
        type="search"
        placeholder="Search by name, brand or flavour"
        aria-label="Search products"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Sort">
        {sorts.map((s) => (
          <button key={s.value} type="button" aria-pressed={sort === s.value} className={chip(sort === s.value)} onClick={() => update({ sort: s.value === 'POPULAR' ? '' : s.value })}>
            {s.label}
          </button>
        ))}
        <button type="button" aria-pressed={deals} className={chip(deals)} onClick={() => update({ deals: deals ? '' : '1' })}>
          🏷️ Deals
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Category">
        <button type="button" aria-pressed={!category} className={chip(!category)} onClick={() => update({ category: '' })}>
          All
        </button>
        {categories.data?.map((c) => (
          <button key={c.id} type="button" aria-pressed={category === c.slug} className={chip(category === c.slug)} onClick={() => update({ category: c.slug })}>
            {c.name}
          </button>
        ))}
      </div>

      <ErrorBanner message={products.error?.message} />
      {products.isPending && (
        <div className="py-12 text-center">
          <Spinner />
        </div>
      )}
      {data && (
        <>
          <p className="text-sm text-slate-500">{data.totalItems} products</p>
          {data.items.length === 0 ? (
            <p className="py-10 text-center text-slate-500">No products match. Try another search or category.</p>
          ) : (
            <ProductGrid products={data.items} />
          )}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2 text-sm">
              <Button variant="secondary" disabled={page === 0} onClick={() => update({ page: String(page - 1) })}>
                Previous
              </Button>
              <span>
                Page {page + 1} of {data.totalPages}
              </span>
              <Button variant="secondary" disabled={page + 1 >= data.totalPages} onClick={() => update({ page: String(page + 1) })}>
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
