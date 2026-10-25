import type { OrderStatus, PaymentStatus } from '../api/types'

export const statusLabels: Record<OrderStatus, string> = {
  PLACED: 'Placed',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  PACKED: 'Packed',
  SHIPPED: 'Shipped',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  RETURNED: 'Returned',
}

export const paymentLabels: Record<string, string> = {
  COD: 'Cash on delivery',
  UPI: 'UPI',
  CREDIT: 'Credit',
  CASH: 'Cash',
}

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  PENDING: 'Payment pending',
  PENDING_VERIFICATION: 'Payment being checked',
  PAID: 'Paid',
  FAILED: 'Payment failed',
  REFUNDED: 'Refunded',
}

/** The steps shown on an order's tracker. Processing and shipped count as packed. */
export const trackerSteps: OrderStatus[] = ['PLACED', 'CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED']

export function trackerIndex(status: OrderStatus): number {
  if (status === 'PROCESSING' || status === 'SHIPPED') return trackerSteps.indexOf('PACKED')
  return trackerSteps.indexOf(status)
}

export type Tone = 'green' | 'gray' | 'amber' | 'red' | 'blue'

export const statusTone = (status: OrderStatus): Tone =>
  status === 'PLACED'
    ? 'amber'
    : status === 'DELIVERED'
      ? 'green'
      : status === 'CANCELLED' || status === 'RETURNED'
        ? 'red'
        : 'blue'
