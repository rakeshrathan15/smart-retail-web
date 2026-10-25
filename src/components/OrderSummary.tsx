import type { Quote } from '../api/types'
import { formatRupees } from '../lib/format'

/** Subtotal, coupon, delivery and total from the server's quote. Used in the cart and at checkout. */
export function OrderSummary({ quote }: { quote: Quote }) {
  return (
    <dl className="space-y-1.5 text-sm">
      <Row label={`Subtotal (${quote.totalCases} cases)`} value={formatRupees(quote.subtotal)} />
      {quote.couponDiscount > 0 && (
        <Row label={`Coupon ${quote.couponCode}`} value={`− ${formatRupees(quote.couponDiscount)}`} className="text-green-700" />
      )}
      <Row
        label="Delivery"
        value={quote.deliveryCharge === 0 ? 'Free' : formatRupees(quote.deliveryCharge)}
        className={quote.deliveryCharge === 0 ? 'text-green-700' : ''}
      />
      {quote.amountForFreeDelivery !== null && (
        <p className="text-xs text-brand">Add {formatRupees(quote.amountForFreeDelivery)} more for free delivery</p>
      )}
      <div className="border-t border-slate-200 pt-2">
        <Row label="Total" value={formatRupees(quote.total)} className="text-base font-semibold" />
      </div>
    </dl>
  )
}

function Row({ label, value, className = '' }: { label: string; value: string; className?: string }) {
  return (
    <div className={`flex justify-between gap-4 ${className}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}
