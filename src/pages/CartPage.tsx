import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import type { Quote, QuoteLine } from '../api/types'
import { useAuth } from '../auth/useAuth'
import { cart, couponCode, useCart, useCouponCode, type CartLine } from '../cart/cart'
import { useQuote } from '../cart/useQuote'
import { OrderSummary } from '../components/OrderSummary'
import { ProductImage } from '../components/ProductImage'
import { QuantityStepper } from '../components/QuantityStepper'
import { Button, ErrorBanner, Spinner } from '../components/ui'
import { formatRupees, packSize } from '../lib/format'

export function CartPage() {
  const lines = useCart()
  const quote = useQuote()
  const { state } = useAuth()
  const navigate = useNavigate()

  if (lines.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="text-5xl" aria-hidden="true">
          🛒
        </div>
        <h1 className="mt-3 text-xl font-semibold">Your cart is empty</h1>
        <p className="text-slate-500">Add cases from the shop to see bulk prices here.</p>
        <Link to="/shop" className="mt-4 inline-block rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark">
          Browse products
        </Link>
      </div>
    )
  }

  const q = quote.data
  const signedIn = state.status === 'signed-in'
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">
        Cart <span className="text-base font-normal text-slate-500">({lines.length} {lines.length === 1 ? 'product' : 'products'})</span>
      </h1>
      <ErrorBanner message={quote.error && !q ? quote.error.message : null} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <ul className="space-y-3" aria-busy={quote.isFetching}>
          {lines.map((line) => (
            <CartRow key={line.productId} line={line} priced={q?.lines.find((l) => l.productId === line.productId)} />
          ))}
        </ul>

        <aside className="space-y-3 lg:sticky lg:top-20 lg:self-start">
          <CouponBox quote={q} />
          <div className="card p-4">
            {q ? <OrderSummary quote={q} /> : <Spinner />}
            {q && q.problems.length > 0 && <Problems problems={q.problems} />}
            <Button
              className="mt-4 w-full py-3"
              disabled={!q || !q.canPlaceOrder || quote.isFetching}
              onClick={() => navigate(signedIn ? '/checkout' : '/login?from=%2Fcheckout')}
            >
              {!q ? 'Checking prices…' : signedIn ? `Checkout · ${formatRupees(q.total)}` : 'Sign in to checkout'}
            </Button>
            {!signedIn && q?.canPlaceOrder && (
              <p className="mt-2 text-center text-xs text-slate-500">Your cart is kept while you sign in or create an account.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

function CartRow({ line, priced }: { line: CartLine; priced: QuoteLine | undefined }) {
  const bulk = priced && priced.pricePerCase < priced.basePrice
  return (
    <li className="card p-3">
      <div className="flex gap-3">
        <Link to={`/product/${line.slug}`} className="shrink-0">
          <ProductImage url={line.imageUrl} label={line.brand ?? line.name} className="h-20 w-20 rounded-lg" />
        </Link>
        <div className="min-w-0 flex-1">
          <Link to={`/product/${line.slug}`} className="line-clamp-2 font-medium hover:text-brand">
            {line.name}
          </Link>
          <div className="text-xs text-slate-500">{packSize(line.unitVolumeMl, line.unitsPerCase)}</div>
          {priced && (
            <div className="mt-1 text-sm">
              <span className="font-semibold">{formatRupees(priced.pricePerCase)}/case</span>
              {bulk && (
                <>
                  <span className="ml-1.5 text-xs text-slate-500 line-through">{formatRupees(priced.basePrice)}</span>
                  <span className="ml-1.5 text-xs font-semibold text-green-700">Bulk price</span>
                </>
              )}
            </div>
          )}
        </div>
        <button
          type="button"
          className="self-start rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600"
          aria-label={`Remove ${line.name}`}
          onClick={() => cart.remove(line.productId)}
        >
          ✕
        </button>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <QuantityStepper value={line.quantity} onChange={(n) => cart.setQuantity(line.productId, n)} label={line.name} />
        {priced && (
          <div className="text-right">
            <div className="font-semibold">{formatRupees(priced.lineTotal)}</div>
            {priced.saving > 0 && <div className="text-xs text-green-700">You save {formatRupees(priced.saving)}</div>}
          </div>
        )}
      </div>
      {priced?.problem && (
        <div className="mt-2 flex items-center justify-between gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {priced.problem}
          {priced.stockAvailable > 0 && priced.quantity > priced.stockAvailable ? (
            <button type="button" className="font-semibold underline" onClick={() => cart.setQuantity(line.productId, priced.stockAvailable)}>
              Change to {priced.stockAvailable}
            </button>
          ) : (
            <button type="button" className="font-semibold underline" onClick={() => cart.remove(line.productId)}>
              Remove
            </button>
          )}
        </div>
      )}
    </li>
  )
}

function CouponBox({ quote }: { quote: Quote | undefined }) {
  const code = useCouponCode()
  const [text, setText] = useState('')

  function apply(event: FormEvent) {
    event.preventDefault()
    couponCode.set(text)
  }

  if (code) {
    const result = quote?.couponCode === code ? quote : undefined
    const problem = result?.couponProblem
    return (
      <div className={`card flex items-center justify-between gap-2 p-3 text-sm ${problem ? 'border-red-200' : 'border-green-200'}`}>
        <div>
          <div className="font-mono font-semibold">{code}</div>
          <div className={problem ? 'text-red-600' : 'text-green-700'}>
            {problem ?? (result ? `You save ${formatRupees(result.couponDiscount)}` : 'Checking…')}
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={() => {
            setText('')
            couponCode.set(null)
          }}
        >
          Remove
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={apply} className="flex gap-2">
      <input className="input uppercase" placeholder="Coupon code" aria-label="Coupon code" value={text} onChange={(e) => setText(e.target.value)} />
      <Button type="submit" variant="secondary" disabled={!text.trim()}>
        Apply
      </Button>
    </form>
  )
}

export function Problems({ problems }: { problems: string[] }) {
  return (
    <ul className="mt-3 space-y-1 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
      {problems.map((p) => (
        <li key={p}>ⓘ {p}</li>
      ))}
    </ul>
  )
}
