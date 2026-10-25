import { useSyncExternalStore } from 'react'
import type { ProductDetail } from '../api/types'

/**
 * The cart, kept in this browser's localStorage. It holds only what is needed to show the cart
 * quickly; the server prices every line again from the product id and case count.
 */
export interface CartLine {
  productId: string
  slug: string
  name: string
  brand: string | null
  imageUrl: string | null
  unitVolumeMl: number | null
  unitsPerCase: number
  quantity: number
}

const STORAGE_KEY = 'smart-retail-web.cart.v1'
export const MAX_CASES_PER_LINE = 9999

type Listener = () => void
const listeners = new Set<Listener>()
let lines: CartLine[] = load()

function load(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? (parsed as CartLine[]).filter((l) => l && typeof l.productId === 'string') : []
  } catch {
    // Corrupt data or blocked storage: start with an empty cart rather than crash.
    return []
  }
}

function commit(next: CartLine[]) {
  lines = next
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Storage full or blocked: the cart still works until the page is closed.
  }
  listeners.forEach((l) => l())
}

// Another tab changed the cart: show the same cart here.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return
    lines = load()
    listeners.forEach((l) => l())
  })
}

const clamp = (quantity: number) => Math.min(Math.max(Math.round(quantity), 1), MAX_CASES_PER_LINE)

export const cart = {
  lines: () => lines,

  add(product: ProductDetail, cases: number) {
    const existing = lines.find((l) => l.productId === product.id)
    if (existing) return cart.setQuantity(product.id, existing.quantity + cases)
    const image = product.images.find((i) => i.primary) ?? product.images[0]
    commit([
      ...lines,
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        brand: product.brand,
        imageUrl: image?.url ?? product.imageUrl,
        unitVolumeMl: product.unitVolumeMl,
        unitsPerCase: product.unitsPerCase,
        quantity: clamp(cases),
      },
    ])
  },

  setQuantity(productId: string, quantity: number) {
    if (quantity <= 0) return cart.remove(productId)
    commit(lines.map((l) => (l.productId === productId ? { ...l, quantity: clamp(quantity) } : l)))
  },

  remove(productId: string) {
    commit(lines.filter((l) => l.productId !== productId))
  },

  clear() {
    commit([])
  },

  /** For tests: reread storage, as on a fresh page load. */
  reload() {
    lines = load()
    listeners.forEach((l) => l())
  },

  subscribe(listener: Listener) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}

export function useCart(): CartLine[] {
  return useSyncExternalStore(cart.subscribe, cart.lines, cart.lines)
}

export function useCartCount(): number {
  return useCart().reduce((sum, l) => sum + l.quantity, 0)
}

// The coupon typed in the cart lives for this visit only, like in the app.
let coupon: string | null = null
const couponListeners = new Set<Listener>()

export const couponCode = {
  get: () => coupon,
  set(code: string | null) {
    coupon = code && code.trim() ? code.trim().toUpperCase() : null
    couponListeners.forEach((l) => l())
  },
  subscribe(listener: Listener) {
    couponListeners.add(listener)
    return () => {
      couponListeners.delete(listener)
    }
  },
}

export function useCouponCode(): string | null {
  return useSyncExternalStore(couponCode.subscribe, couponCode.get, couponCode.get)
}
