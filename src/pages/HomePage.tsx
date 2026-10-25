import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { shopApi } from '../api/shop'
import type { Banner, ProductCard as Product } from '../api/types'
import { ProductCard } from '../components/ProductCard'
import { PinIcon } from '../components/icons'
import { ErrorBanner, Spinner } from '../components/ui'

const categoryEmoji: Record<string, string> = {
  colas: '🥤',
  juices: '🧃',
  'energy-drinks': '⚡',
  'packaged-water': '💧',
  'sparkling-lime': '🍋',
}

const trust = [
  ['✅', 'FSSAI certified'],
  ['🚚', 'Bulk delivery'],
  ['🏷️', 'Best slab prices'],
  ['⏱️', 'Same-day dispatch'],
]

export function HomePage() {
  const settings = useQuery({ queryKey: ['settings'], queryFn: shopApi.settings, staleTime: 60_000 })
  const banners = useQuery({ queryKey: ['banners'], queryFn: shopApi.banners })
  const categories = useQuery({ queryKey: ['categories'], queryFn: shopApi.categories })
  const deals = useQuery({ queryKey: ['products', 'deals'], queryFn: () => shopApi.products({ deals: true, size: 10 }) })
  const newest = useQuery({ queryKey: ['products', 'newest'], queryFn: () => shopApi.products({ sort: 'NEWEST', size: 10 }) })

  const open = settings.data?.store_open !== 'false'
  return (
    <div className="space-y-8">
      {settings.data && (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          {settings.data.store_address && (
            <span className="inline-flex items-center gap-1 text-slate-600">
              <PinIcon /> {settings.data.store_address}
            </span>
          )}
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              open ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${open ? 'bg-green-500' : 'bg-red-500'}`} />
            {open ? 'Open for orders' : 'Closed right now'}
          </span>
        </div>
      )}

      {banners.data && banners.data.length > 0 && <BannerCarousel banners={banners.data} />}

      <section aria-labelledby="categories-heading">
        <h2 id="categories-heading" className="mb-3 text-lg font-semibold">
          Shop by category
        </h2>
        <ErrorBanner message={categories.error?.message} />
        <div className="flex gap-3 overflow-x-auto pb-1">
          {categories.data?.map((c) => (
            <Link
              key={c.id}
              to={`/shop?category=${c.slug}`}
              className="card flex w-28 shrink-0 flex-col items-center gap-2 p-3 text-center text-sm hover:border-brand"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-light text-2xl" aria-hidden="true">
                {categoryEmoji[c.slug] ?? '🛒'}
              </span>
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      <ul className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        {trust.map(([emoji, label]) => (
          <li key={label} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200">
            <span aria-hidden="true">{emoji}</span>
            {label}
          </li>
        ))}
      </ul>

      <Rail title="Special deals" viewAll="/shop?deals=1" products={deals.data?.items} loading={deals.isPending} error={deals.error?.message} />
      <Rail title="New arrivals" viewAll="/shop?sort=NEWEST" products={newest.data?.items} loading={newest.isPending} error={newest.error?.message} />
    </div>
  )
}

function Rail({
  title,
  viewAll,
  products,
  loading,
  error,
}: {
  title: string
  viewAll: string
  products: Product[] | undefined
  loading: boolean
  error: string | undefined
}) {
  return (
    <section aria-label={title}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Link to={viewAll} className="text-sm font-medium text-brand hover:underline">
          View all
        </Link>
      </div>
      <ErrorBanner message={error} />
      {loading && <Spinner />}
      {products && products.length === 0 && <p className="text-sm text-slate-500">Nothing here yet.</p>}
      {products && products.length > 0 && (
        <div className="grid auto-cols-[minmax(10rem,1fr)] grid-flow-col gap-3 overflow-x-auto pb-2 sm:auto-cols-[minmax(11rem,13rem)]">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  )
}

const gradients = ['from-brand to-blue-500', 'from-red-700 to-orange-500', 'from-emerald-700 to-emerald-500']

function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const count = banners.length
  const current = banners[index % count]

  useEffect(() => {
    if (count < 2 || paused) return
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), 5000)
    return () => clearInterval(timer)
  }, [count, paused])

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Offers"
      className="relative overflow-hidden rounded-2xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className={`relative flex min-h-44 flex-col justify-center bg-gradient-to-r p-6 text-white sm:min-h-56 sm:p-10 ${gradients[index % gradients.length]}`}
        style={current.imageUrl ? { backgroundImage: `linear-gradient(rgba(0,0,0,.45),rgba(0,0,0,.45)), url(${current.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
        aria-live={paused ? 'polite' : 'off'}
      >
        <h2 className="text-2xl font-bold sm:text-3xl">{current.title}</h2>
        {current.subtitle && <p className="mt-1 max-w-xl text-white/90">{current.subtitle}</p>}
        {current.ctaText && current.link?.startsWith('/') && (
          <Link to={current.link} className="mt-4 self-start rounded-md bg-white px-4 py-2 text-sm font-semibold text-brand hover:bg-brand-light">
            {current.ctaText}
          </Link>
        )}
      </div>
      {count > 1 && (
        <div className="absolute right-0 bottom-3 left-0 flex justify-center gap-2">
          {banners.map((b, i) => (
            <button
              key={b.id}
              type="button"
              aria-label={`Show offer ${i + 1}: ${b.title}`}
              aria-current={i === index}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all ${i === index ? 'w-6 bg-white' : 'w-2 bg-white/50'}`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
