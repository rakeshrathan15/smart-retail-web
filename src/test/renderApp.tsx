import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { App } from '../App'
import { AuthProvider } from '../auth/AuthContext'

/** The whole website at `path`, with a fresh query cache and no retries. */
export function renderApp(path = '/') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

export const user = { id: 'u1', email: null, phone: '9876543210', fullName: 'Ravi Kumar', roles: ['CUSTOMER'], shopProfileComplete: false }

export const auth = { accessToken: 'access-1', refreshToken: 'refresh-1', tokenType: 'Bearer', expiresIn: 900, user }

export const category = { id: 'c1', name: 'Colas', slug: 'colas', imageUrl: null }

export const card = {
  id: 'p1',
  slug: 'thums-up-750ml-pet',
  name: 'Thums Up 750ml PET',
  brand: 'Thums Up',
  categoryId: 'c1',
  unitVolumeMl: 750,
  unitsPerCase: 12,
  price: 420,
  originalPrice: 480,
  lowestPrice: 357,
  imageUrl: null,
  inStock: true,
  badge: 'Bestseller',
}

export const detail = {
  ...card,
  flavor: 'Cola',
  category,
  weight: null,
  description: 'Strong fizzy cola.',
  ingredients: null,
  images: [],
  slabs: [
    { minQty: 10, maxQty: 24, pricePerCase: 378 },
    { minQty: 25, maxQty: null, pricePerCase: 357 },
  ],
}

export const page = <T,>(items: T[]) => ({ items, page: 0, size: 24, totalItems: items.length, totalPages: 1 })

/** A server quote like the real one: ₹420/case, ₹378 from 10 cases, SAVE5 = 5%, delivery ₹500 under ₹5,000. */
export function quoteFor(body: { items: { productId: string; quantity: number }[]; couponCode: string | null }, credit: unknown = null) {
  const lines = body.items.map((i) => {
    const price = i.quantity >= 10 ? 378 : 420
    return {
      productId: i.productId,
      slug: card.slug,
      name: card.name,
      brand: card.brand,
      imageUrl: null,
      unitsPerCase: 12,
      quantity: i.quantity,
      basePrice: 420,
      pricePerCase: price,
      lineTotal: price * i.quantity,
      saving: (420 - price) * i.quantity,
      stockAvailable: 80,
      problem: null,
    }
  })
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0)
  const couponOk = body.couponCode === 'SAVE5'
  const discount = couponOk ? Math.round(subtotal * 0.05) : 0
  const delivery = subtotal - discount >= 5000 ? 0 : 500
  const problems = subtotal < 1000 ? [`Minimum order is ₹1,000. Add ₹${1000 - subtotal} more.`] : []
  return {
    lines,
    totalCases: lines.reduce((s, l) => s + l.quantity, 0),
    subtotal,
    couponCode: body.couponCode,
    couponDiscount: discount,
    couponProblem: body.couponCode && !couponOk ? 'This coupon code is not valid' : null,
    deliveryCharge: delivery,
    freeDeliveryAbove: 5000,
    amountForFreeDelivery: delivery ? 5000 - (subtotal - discount) : null,
    total: subtotal - discount + delivery,
    minOrderValue: 1000,
    storeOpen: true,
    upiId: 'smartretail@upi',
    credit,
    problems,
    canPlaceOrder: problems.length === 0,
  }
}

export const catalogRoutes = {
  'GET /api/settings/public': () => ({ status: 200, body: { store_name: "S'Mart Retail", store_open: 'true', store_address: 'Telangana, India' } }),
  'GET /api/banners': () => ({ status: 200, body: [{ id: 'b1', title: 'Bulk case pricing', subtitle: 'Slab discounts apply', ctaText: 'Shop cases', link: '/shop', imageUrl: null }] }),
  'GET /api/categories': () => ({ status: 200, body: [category, { id: 'c2', name: 'Juices', slug: 'juices', imageUrl: null }] }),
  'GET /api/products': () => ({ status: 200, body: page([card]) }),
  'GET /api/products/thums-up-750ml-pet': () => ({ status: 200, body: detail }),
  'POST /api/checkout/quote': ({ body }: { body: unknown }) => ({ status: 200, body: quoteFor(body as Parameters<typeof quoteFor>[0]) }),
}
