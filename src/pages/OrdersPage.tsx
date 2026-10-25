import { useQuery } from '@tanstack/react-query'
import { Link, useParams, useSearchParams } from 'react-router'
import { shopApi } from '../api/shop'
import { Badge, ErrorBanner, Spinner } from '../components/ui'
import { formatDateTime, formatRupees } from '../lib/format'
import { paymentLabels, paymentStatusLabels, statusLabels, statusTone, trackerIndex, trackerSteps } from '../lib/orderLabels'

export function OrdersPage() {
  const orders = useQuery({ queryKey: ['orders'], queryFn: () => shopApi.myOrders() })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">My orders</h1>
      <ErrorBanner message={orders.error?.message} />
      {orders.isPending && <Spinner />}
      {orders.data?.items.length === 0 && (
        <div className="py-12 text-center text-slate-500">
          No orders yet.{' '}
          <Link to="/shop" className="text-brand hover:underline">
            Start shopping
          </Link>
        </div>
      )}
      <ul className="space-y-3">
        {orders.data?.items.map((o) => (
          <li key={o.id}>
            <Link to={`/orders/${o.id}`} className="card block p-4 hover:border-brand">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">Order {o.orderNumber}</span>
                <Badge tone={statusTone(o.status)}>{statusLabels[o.status]}</Badge>
              </div>
              <div className="text-xs text-slate-500">{formatDateTime(o.createdAt)}</div>
              <div className="mt-2 flex justify-between gap-2 text-sm">
                <span>
                  {o.totalCases} cases · {paymentLabels[o.paymentMethod]} · {paymentStatusLabels[o.paymentStatus]}
                </span>
                <span className="font-semibold">{formatRupees(o.total)}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Order detail; with ?placed=1 it is also the "order placed" page right after checkout. */
export function OrderDetailPage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const justPlaced = params.get('placed') === '1'
  const order = useQuery({ queryKey: ['orders', id], queryFn: () => shopApi.order(id!) })

  if (order.isPending) {
    return (
      <div className="py-16 text-center">
        <Spinner />
      </div>
    )
  }
  if (order.error) return <ErrorBanner message={order.error.message} />

  const o = order.data
  const reached = trackerIndex(o.status)
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {justPlaced ? (
        <div className="card p-6 text-center">
          <div className="text-5xl" aria-hidden="true">
            ✅
          </div>
          <h1 className="mt-2 text-2xl font-semibold">Order placed!</h1>
          <p className="text-lg">Order number {o.orderNumber}</p>
          <p className="text-slate-600">
            {o.paymentStatus === 'PENDING_VERIFICATION'
              ? 'We will check your UPI payment and confirm the order.'
              : 'We will confirm your order soon.'}
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <Link to="/orders" className="rounded-md px-4 py-2 text-sm font-medium text-brand ring-1 ring-brand hover:bg-brand-light">
              My orders
            </Link>
            <Link to="/shop" className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark">
              Keep shopping
            </Link>
          </div>
        </div>
      ) : (
        <>
          <Link to="/orders" className="text-sm text-slate-600 hover:underline">
            ← My orders
          </Link>
          <h1 className="text-2xl font-semibold">Order {o.orderNumber}</h1>
        </>
      )}

      <div className="card p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-slate-500">{formatDateTime(o.createdAt)}</span>
          <Badge tone={statusTone(o.status)}>{statusLabels[o.status]}</Badge>
        </div>
        {reached >= 0 && (
          <ol className="mt-4 grid grid-cols-5 gap-1 text-center text-xs" aria-label="Order progress">
            {trackerSteps.map((step, i) => (
              <li key={step} className={i <= reached ? 'font-semibold text-green-700' : 'text-slate-400'} aria-current={i === reached ? 'step' : undefined}>
                <span className="mx-auto mb-1 block text-lg" aria-hidden="true">
                  {i <= reached ? '●' : '○'}
                </span>
                {statusLabels[step]}
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <tbody>
            {o.items.map((item, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="px-4 py-3">
                  {item.productName}
                  <div className="text-xs text-slate-500">
                    {item.quantity} cases × {formatRupees(item.price)}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">{formatRupees(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <dl className="space-y-1 p-4 text-sm">
          <Line label={`Subtotal (${o.totalCases} cases)`} value={formatRupees(o.subtotal)} />
          {o.discount > 0 && <Line label={`Coupon ${o.couponCode ?? ''}`} value={`− ${formatRupees(o.discount)}`} />}
          <Line label="Delivery" value={o.deliveryCharge === 0 ? 'Free' : formatRupees(o.deliveryCharge)} />
          <div className="border-t border-slate-200 pt-2 text-base font-semibold">
            <Line label="Total" value={formatRupees(o.total)} />
          </div>
        </dl>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card p-4 text-sm">
          <h2 className="mb-1 font-semibold">Payment</h2>
          {paymentLabels[o.paymentMethod]} · {paymentStatusLabels[o.paymentStatus]}
        </div>
        {o.address && (
          <div className="card p-4 text-sm">
            <h2 className="mb-1 font-semibold">Delivery address</h2>
            <div>
              {o.address.label} · {o.address.fullName}
            </div>
            <div className="text-slate-600">
              {[o.address.addressLine1, o.address.addressLine2, `${o.address.city} ${o.address.pincode}`].filter(Boolean).join(', ')}
            </div>
            <div className="text-slate-600">+91 {o.address.phone}</div>
          </div>
        )}
      </div>
      {o.notes && (
        <div className="card p-4 text-sm">
          <h2 className="mb-1 font-semibold">Note</h2>
          {o.notes}
        </div>
      )}
    </div>
  )
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}
