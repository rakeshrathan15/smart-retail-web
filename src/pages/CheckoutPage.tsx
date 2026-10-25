import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { shopApi, imageProblem } from '../api/shop'
import type { PaymentMethod, Quote } from '../api/types'
import { cart, couponCode, useCart } from '../cart/cart'
import { useQuote } from '../cart/useQuote'
import { OrderSummary } from '../components/OrderSummary'
import { Button, ErrorBanner, Spinner } from '../components/ui'
import { formatRupees } from '../lib/format'
import { AddressForm } from './AddressForm'
import { Problems } from './CartPage'

export function CheckoutPage() {
  const lines = useCart()
  const quote = useQuote()
  const addresses = useQuery({ queryKey: ['addresses'], queryFn: shopApi.addresses })
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const [chosenAddress, setChosenAddress] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [method, setMethod] = useState<PaymentMethod>('COD')
  const [screenshot, setScreenshot] = useState<{ reference: string; name: string } | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  const upload = useMutation({
    mutationFn: shopApi.uploadPaymentScreenshot,
    onSuccess: (result, file) => {
      setScreenshot({ reference: result.reference, name: file.name })
      setUploadError(null)
    },
    onError: (e) => setUploadError(e.message),
  })

  const place = useMutation({
    mutationFn: (q: Quote) =>
      shopApi.placeOrder({
        items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        // Only a coupon the server accepted; a rejected one was not counted in the total either.
        couponCode: q.couponCode && !q.couponProblem ? q.couponCode : null,
        addressId: selected!.id,
        paymentMethod: method,
        paymentScreenshot: method === 'UPI' ? (screenshot?.reference ?? null) : null,
        notes: notes.trim() || null,
        expectedTotal: q.total,
      }),
    onSuccess: (order) => {
      // Leave the page first: an empty cart must not send the shop owner back to the cart.
      navigate(`/orders/${order.id}?placed=1`, { replace: true })
      cart.clear()
      couponCode.set(null)
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
    onError: (e) => {
      // Prices, stock or credit may have changed: get a fresh quote so the page matches the server.
      queryClient.invalidateQueries({ queryKey: ['quote'] })
      setError(e.message)
    },
  })

  if (lines.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-slate-600">Your cart is empty.</p>
        <Link to="/shop" className="mt-3 inline-block text-brand hover:underline">
          Browse products
        </Link>
      </div>
    )
  }
  const q = quote.data
  if (!q) {
    return (
      <div className="py-16 text-center">
        {quote.error ? <ErrorBanner message={quote.error.message} /> : <Spinner />}
      </div>
    )
  }

  const list = addresses.data ?? []
  const selected = list.find((a) => a.id === chosenAddress) ?? list.find((a) => a.isDefault) ?? list[0]
  const credit = q.credit
  const creditProblem = !credit
    ? 'Not enabled for your shop'
    : credit.available < q.total
      ? `Only ${formatRupees(Math.max(credit.available, 0))} available`
      : null
  const needsScreenshot = method === 'UPI' && !screenshot
  const blocker = !selected
    ? 'Add a delivery address'
    : needsScreenshot
      ? 'Upload the UPI screenshot'
      : method === 'CREDIT' && creditProblem
        ? 'Choose another payment method'
        : null
  const canPlace = q.canPlaceOrder && !blocker && !quote.isFetching && !upload.isPending && !place.isPending

  return (
    <div className="space-y-4">
      <Link to="/cart" className="text-sm text-slate-600 hover:underline">
        ← Back to cart
      </Link>
      <h1 className="text-2xl font-semibold">Checkout</h1>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-4">
          <section className="card p-4" aria-labelledby="address-heading">
            <h2 id="address-heading" className="mb-3 font-semibold">
              Deliver to
            </h2>
            {addresses.isPending && <Spinner />}
            <ErrorBanner message={addresses.error?.message} />
            <fieldset className="space-y-2">
              <legend className="sr-only">Delivery address</legend>
              {list.map((a) => (
                <label
                  key={a.id}
                  className={`flex cursor-pointer gap-3 rounded-lg p-3 ring-1 ${selected?.id === a.id ? 'bg-brand-light/40 ring-brand' : 'ring-slate-200'}`}
                >
                  <input type="radio" name="address" checked={selected?.id === a.id} onChange={() => setChosenAddress(a.id)} className="mt-1" />
                  <span className="text-sm">
                    <span className="font-medium">
                      {a.label} · {a.fullName}
                    </span>
                    <span className="block text-slate-600">
                      {[a.addressLine1, a.addressLine2, `${a.city} ${a.pincode}`].filter(Boolean).join(', ')}
                    </span>
                    <span className="block text-slate-600">+91 {a.phone}</span>
                  </span>
                </label>
              ))}
            </fieldset>
            {adding ? (
              <div className="mt-3 rounded-lg bg-slate-50 p-3">
                <AddressForm
                  onSaved={(address) => {
                    setChosenAddress(address.id)
                    setAdding(false)
                  }}
                  onCancel={list.length > 0 ? () => setAdding(false) : undefined}
                />
              </div>
            ) : (
              <Button variant="secondary" className="mt-3" onClick={() => setAdding(true)}>
                + {list.length === 0 ? 'Add delivery address' : 'Add another address'}
              </Button>
            )}
          </section>

          <section className="card p-4" aria-labelledby="payment-heading">
            <h2 id="payment-heading" className="mb-3 font-semibold">
              Payment
            </h2>
            <fieldset className="space-y-2">
              <legend className="sr-only">Payment method</legend>
              <PaymentOption value="COD" current={method} onChange={setMethod} title="Cash on delivery" detail="Pay when the cases arrive" />
              <PaymentOption
                value="UPI"
                current={method}
                onChange={setMethod}
                title="UPI"
                detail={q.upiId ? 'Pay now and upload the screenshot' : 'Not available right now'}
                disabled={!q.upiId}
              />
              <PaymentOption
                value="CREDIT"
                current={method}
                onChange={setMethod}
                title="Credit"
                detail={creditProblem ?? `${formatRupees(credit!.available)} available of ${formatRupees(credit!.limit)}`}
                disabled={creditProblem !== null}
              />
            </fieldset>

            {method === 'UPI' && (
              <div className="mt-3 space-y-2 rounded-lg bg-brand-light/40 p-3 text-sm">
                <p>
                  1. Pay <strong>{formatRupees(q.total)}</strong> to
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <code className="rounded bg-white px-2 py-1 text-base font-semibold">{q.upiId}</code>
                  <Button variant="secondary" onClick={() => navigator.clipboard?.writeText(q.upiId)}>
                    Copy
                  </Button>
                </div>
                <p>2. Upload the payment screenshot</p>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-white px-3 py-2 ring-1 ring-slate-300 hover:bg-slate-50">
                  {upload.isPending ? 'Uploading…' : screenshot ? `✅ ${screenshot.name} (change)` : 'Choose screenshot'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    aria-label="UPI payment screenshot"
                    disabled={upload.isPending}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      e.target.value = ''
                      if (!file) return
                      const problem = imageProblem(file)
                      if (problem) return setUploadError(problem)
                      upload.mutate(file)
                    }}
                  />
                </label>
                <ErrorBanner message={uploadError} />
                <p className="text-xs text-slate-600">We check the payment before dispatch. Only our team can see the screenshot.</p>
              </div>
            )}
          </section>

          <section className="card p-4">
            <label className="label" htmlFor="notes">
              Note for delivery (optional)
            </label>
            <textarea id="notes" className="input" rows={2} maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </section>
        </div>

        <aside className="card space-y-3 p-4 lg:sticky lg:top-20 lg:self-start">
          <h2 className="font-semibold">Order</h2>
          <ul className="space-y-1 text-sm">
            {q.lines.map((l) => (
              <li key={l.productId} className="flex justify-between gap-2">
                <span className="truncate">
                  {l.quantity} × {l.name}
                </span>
                <span>{formatRupees(l.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <OrderSummary quote={q} />
          {q.problems.length > 0 && <Problems problems={q.problems} />}
          {/* Next to the button, so the reason for a refused order is always seen. */}
          <ErrorBanner message={error} />
          <Button className="w-full py-3" disabled={!canPlace} busy={place.isPending} onClick={() => place.mutate(q)}>
            {blocker ?? `Place order · ${formatRupees(q.total)}`}
          </Button>
        </aside>
      </div>
    </div>
  )
}

function PaymentOption({
  value,
  current,
  onChange,
  title,
  detail,
  disabled = false,
}: {
  value: PaymentMethod
  current: PaymentMethod
  onChange: (m: PaymentMethod) => void
  title: string
  detail: string
  disabled?: boolean
}) {
  return (
    <label
      className={`flex gap-3 rounded-lg p-3 ring-1 ${disabled ? 'cursor-not-allowed opacity-50 ring-slate-200' : 'cursor-pointer'} ${
        current === value ? 'bg-brand-light/40 ring-brand' : 'ring-slate-200'
      }`}
    >
      <input type="radio" name="payment" value={value} checked={current === value} disabled={disabled} onChange={() => onChange(value)} className="mt-1" />
      <span className="text-sm">
        <span className="block font-medium">{title}</span>
        <span className="text-slate-600">{detail}</span>
      </span>
    </label>
  )
}
