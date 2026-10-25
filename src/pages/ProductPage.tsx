import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { ApiError } from '../api/client'
import { shopApi } from '../api/shop'
import type { ProductDetail } from '../api/types'
import { cart } from '../cart/cart'
import { ProductImage } from '../components/ProductImage'
import { QuantityStepper } from '../components/QuantityStepper'
import { Button, ErrorBanner, Spinner } from '../components/ui'
import { discountPercent, formatRupees, packSize, pricePerCaseFor, slabRows } from '../lib/format'

export function ProductPage() {
  const { slug } = useParams()
  const product = useQuery({ queryKey: ['product', slug], queryFn: () => shopApi.product(slug!) })

  if (product.isPending) {
    return (
      <div className="py-16 text-center">
        <Spinner />
      </div>
    )
  }
  if (product.error) {
    const notFound = product.error instanceof ApiError && product.error.status === 404
    return (
      <div className="py-16 text-center">
        <ErrorBanner message={notFound ? 'This product is not available.' : product.error.message} />
        <Link to="/shop" className="mt-4 inline-block text-brand hover:underline">
          ← Back to the shop
        </Link>
      </div>
    )
  }
  // Remounts for a new product, so the case count starts again at 1.
  return <ProductView key={product.data.id} product={product.data} />
}

function ProductView({ product: p }: { product: ProductDetail }) {
  const [cases, setCases] = useState(1)
  const [added, setAdded] = useState<number | null>(null)
  const [imageIndex, setImageIndex] = useState(0)

  const unitPrice = pricePerCaseFor(p, cases)
  const saving = (p.price - unitPrice) * cases
  const discount = discountPercent(p)
  const rows = slabRows(p)
  const image = p.images[imageIndex] ?? null

  function addToCart() {
    cart.add(p, cases)
    setAdded(cases)
  }

  return (
    <div className="space-y-4">
      <nav className="text-sm text-slate-500" aria-label="Breadcrumb">
        <Link to="/shop" className="hover:underline">
          Shop
        </Link>
        {p.category && (
          <>
            {' / '}
            <Link to={`/shop?category=${p.category.slug}`} className="hover:underline">
              {p.category.name}
            </Link>
          </>
        )}
      </nav>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <ProductImage url={image?.url ?? null} label={p.brand ?? p.name} className="aspect-square w-full rounded-xl" />
          {p.images.length > 1 && (
            <div className="mt-2 flex gap-2">
              {p.images.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  aria-label={`Photo ${i + 1}`}
                  aria-current={i === imageIndex}
                  onClick={() => setImageIndex(i)}
                  className={`h-16 w-16 overflow-hidden rounded-md ring-2 ${i === imageIndex ? 'ring-brand' : 'ring-transparent'}`}
                >
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            {p.brand && <div className="text-xs font-semibold tracking-wide text-brand uppercase">{p.brand}</div>}
            <h1 className="text-2xl font-bold">{p.name}</h1>
            <div className="text-slate-600">{[packSize(p.unitVolumeMl, p.unitsPerCase), p.flavor].filter(Boolean).join(' · ')}</div>
          </div>

          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-2xl font-bold">{formatRupees(p.price)}/case</span>
            {discount !== null && p.originalPrice !== null && (
              <>
                <span className="text-slate-500 line-through">{formatRupees(p.originalPrice)}</span>
                <span className="font-semibold text-accent">{discount}% off</span>
              </>
            )}
          </div>
          <div className={p.inStock ? 'text-sm text-green-700' : 'text-sm text-red-600'}>{p.inStock ? 'In stock' : 'Out of stock'}</div>

          {rows.length > 0 && (
            <section>
              <h2 className="mb-2 font-semibold">Bulk prices</h2>
              <table className="w-full overflow-hidden rounded-lg text-sm ring-1 ring-slate-200">
                <tbody>
                  {rows.map((row) => {
                    const active = cases >= row.min && (row.max === null || cases <= row.max)
                    return (
                      <tr key={row.min} className={active ? 'bg-brand-light font-semibold' : 'bg-white'} aria-current={active}>
                        <td className="px-3 py-2">{row.max === null ? `${row.min}+ cases` : `${row.min}–${row.max} cases`}</td>
                        <td className="px-3 py-2 text-right">{formatRupees(row.price)}/case</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </section>
          )}

          <div className="card space-y-3 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium">Cases</span>
              <QuantityStepper value={cases} onChange={setCases} label={p.name} />
            </div>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt>Price per case</dt>
                <dd>{formatRupees(unitPrice)}</dd>
              </div>
              <div className="flex justify-between font-semibold">
                <dt>
                  Total ({cases} × {p.unitsPerCase} units)
                </dt>
                <dd>{formatRupees(unitPrice * cases)}</dd>
              </div>
              {saving > 0 && (
                <div className="flex justify-between text-green-700">
                  <dt>Bulk saving</dt>
                  <dd>{formatRupees(saving)}</dd>
                </div>
              )}
            </dl>
            <Button className="w-full py-3" disabled={!p.inStock} onClick={addToCart}>
              {p.inStock ? `Add ${cases} ${cases === 1 ? 'case' : 'cases'} to cart` : 'Out of stock'}
            </Button>
            {added !== null && (
              <div role="status" className="flex items-center justify-between rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
                Added {added} {added === 1 ? 'case' : 'cases'} to your cart.
                <Link to="/cart" className="font-semibold underline">
                  View cart
                </Link>
              </div>
            )}
          </div>

          {p.description && (
            <section>
              <h2 className="font-semibold">About</h2>
              <p className="text-sm text-slate-700">{p.description}</p>
            </section>
          )}
          {p.ingredients && (
            <section>
              <h2 className="font-semibold">Ingredients</h2>
              <p className="text-sm text-slate-700">{p.ingredients}</p>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
