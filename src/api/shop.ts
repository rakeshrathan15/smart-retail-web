import { api } from './client'
import type {
  Address,
  AddressInput,
  AuthResponse,
  Banner,
  Category,
  OrderDetail,
  OrderSummary,
  Page,
  PaymentMethod,
  MyDeliveryRoute,
  ProductCard,
  ProductDetail,
  ProductSort,
  PublicSettings,
  Quote,
  ShopProfile,
  ShopProfileInput,
  UserSummary,
} from './types'

export interface CartItem {
  productId: string
  quantity: number
}

export interface ProductQuery {
  category?: string
  q?: string
  deals?: boolean
  sort?: ProductSort
  page?: number
  size?: number
}

/** Storefront endpoints. Catalog calls work without login; the rest need a signed-in shop owner. */
export const shopApi = {
  // Catalog (public)
  settings: () => api<PublicSettings>('/api/settings/public'),
  banners: () => api<Banner[]>('/api/banners'),
  categories: () => api<Category[]>('/api/categories'),
  products: (query: ProductQuery) =>
    api<Page<ProductCard>>('/api/products', {
      query: { ...query, deals: query.deals ? true : undefined, size: query.size ?? 24 },
    }),
  product: (slug: string) => api<ProductDetail>(`/api/products/${encodeURIComponent(slug)}`),

  // Account
  login: (identifier: string, password: string) =>
    api<AuthResponse>('/api/auth/login', { method: 'POST', json: { identifier, password } }),
  register: (body: { fullName: string; email: string | null; phone: string | null; password: string }) =>
    api<AuthResponse>('/api/auth/register', { method: 'POST', json: body }),
  logout: (refreshToken: string) => api<void>('/api/auth/logout', { method: 'POST', json: { refreshToken } }),
  me: () => api<UserSummary>('/api/me'),
  shopProfile: () => api<ShopProfile>('/api/me/shop-profile'),
  deliveryRoute: () => api<MyDeliveryRoute>('/api/me/delivery-route'),
  saveShopProfile: (body: ShopProfileInput) => api<ShopProfile>('/api/me/shop-profile', { method: 'PUT', json: body }),

  // Checkout
  quote: (items: CartItem[], couponCode: string | null) =>
    api<Quote>('/api/checkout/quote', { method: 'POST', json: { items, couponCode } }),
  addresses: () => api<Address[]>('/api/me/addresses'),
  addAddress: (body: AddressInput) => api<Address>('/api/me/addresses', { method: 'POST', json: body }),
  uploadPaymentScreenshot: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api<{ reference: string }>('/api/me/payment-screenshots', { method: 'POST', form })
  },
  placeOrder: (body: {
    items: CartItem[]
    couponCode: string | null
    addressId: string
    paymentMethod: PaymentMethod
    paymentScreenshot: string | null
    notes: string | null
    expectedTotal: number
  }) => api<OrderDetail>('/api/orders', { method: 'POST', json: body }),

  // Orders
  myOrders: (page = 0) => api<Page<OrderSummary>>('/api/me/orders', { query: { page, size: 30 } }),
  order: (id: string) => api<OrderDetail>(`/api/me/orders/${id}`),
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

/** Same limits as the backend, checked before uploading so the shop owner gets a quick answer. */
export function imageProblem(file: File): string | null {
  if (!IMAGE_TYPES.includes(file.type)) return 'Choose a JPG, PNG or WebP image'
  if (file.size > MAX_IMAGE_BYTES) return 'The image must be 5 MB or smaller'
  return null
}
