import type { ProductCard, ProductDetail } from '../api/types'

const rupees = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })

/** ₹1,440 or ₹1,440.5 with Indian digit grouping (₹1,00,000). */
export function formatRupees(amount: number): string {
  return rupees.format(amount).replace(/\.00$/, '')
}

/** "750ml × 12/case", "1L × 12/case", or "12/case" when the volume is unknown. */
export function packSize(unitVolumeMl: number | null, unitsPerCase: number): string {
  if (unitVolumeMl === null) return `${unitsPerCase}/case`
  const volume = unitVolumeMl >= 1000 && unitVolumeMl % 1000 === 0 ? `${unitVolumeMl / 1000}L` : `${unitVolumeMl}ml`
  return `${volume} × ${unitsPerCase}/case`
}

/** Whole-number percentage off the original price, or null when there is no discount. */
export function discountPercent(p: Pick<ProductCard, 'price' | 'originalPrice'>): number | null {
  if (p.originalPrice === null || p.originalPrice <= p.price) return null
  return Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
}

/** Same rule as the backend: the slab with the highest min cases that is not above `cases`. */
export function pricePerCaseFor(p: Pick<ProductDetail, 'price' | 'slabs'>, cases: number): number {
  let best: number | null = null
  let bestMin = 0
  for (const slab of p.slabs) {
    if (slab.minQty <= cases && slab.minQty > bestMin) {
      best = slab.pricePerCase
      bestMin = slab.minQty
    }
  }
  return best ?? p.price
}

/** Rows like 1–9 cases ₹420, 10–24 cases ₹378, 25+ cases ₹357. */
export function slabRows(p: Pick<ProductDetail, 'price' | 'slabs'>): { min: number; max: number | null; price: number }[] {
  const rows: { min: number; max: number | null; price: number }[] = []
  if (p.slabs.length === 0) return rows
  if (p.slabs[0].minQty > 1) rows.push({ min: 1, max: p.slabs[0].minQty - 1, price: p.price })
  p.slabs.forEach((slab, i) => {
    const next = p.slabs[i + 1]
    rows.push({ min: slab.minQty, max: slab.maxQty ?? (next ? next.minQty - 1 : null), price: slab.pricePerCase })
  })
  return rows
}

const dateTime = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

/** "25 Oct 2026, 5:29 pm" in the browser's time zone. */
export function formatDateTime(iso: string): string {
  return dateTime.format(new Date(iso))
}
