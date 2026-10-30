// Mirrors the backend's AuthDtos, CatalogDtos and OrderDtos. Money is rupees; prices are per case.

export interface UserSummary {
  id: string
  email: string | null
  phone: string | null
  fullName: string | null
  roles: string[]
  shopProfileComplete: boolean
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  user: UserSummary
}

export interface Page<T> {
  items: T[]
  page: number
  size: number
  totalItems: number
  totalPages: number
}

// ---- Catalog ----------------------------------------------------------

export interface Category {
  id: string
  name: string
  slug: string
  imageUrl: string | null
}

export interface ProductCard {
  id: string
  slug: string
  name: string
  brand: string | null
  categoryId: string | null
  unitVolumeMl: number | null
  unitsPerCase: number
  price: number
  originalPrice: number | null
  lowestPrice: number
  imageUrl: string | null
  inStock: boolean
  badge: string | null
}

export interface Slab {
  minQty: number
  maxQty: number | null
  pricePerCase: number
}

export interface ProductDetail extends ProductCard {
  flavor: string | null
  category: Category | null
  weight: string | null
  description: string | null
  ingredients: string | null
  images: { id: string; url: string; primary: boolean }[]
  /** Sorted by minQty. */
  slabs: Slab[]
}

export interface Banner {
  id: string
  title: string
  subtitle: string | null
  ctaText: string | null
  /** An in-app path such as "/shop?category=colas". */
  link: string | null
  imageUrl: string | null
}

export type ProductSort = 'POPULAR' | 'PRICE_ASC' | 'PRICE_DESC' | 'NEWEST'

/** GET /api/settings/public, a key/value map. */
export type PublicSettings = Record<string, string>

// ---- Checkout ---------------------------------------------------------

export interface QuoteLine {
  productId: string
  slug: string | null
  name: string
  brand: string | null
  imageUrl: string | null
  unitsPerCase: number
  quantity: number
  basePrice: number
  pricePerCase: number
  lineTotal: number
  saving: number
  stockAvailable: number
  problem: string | null
}

/** The server's price for the cart. The website shows these numbers; it never adds prices up itself. */
export interface Quote {
  lines: QuoteLine[]
  totalCases: number
  subtotal: number
  couponCode: string | null
  couponDiscount: number
  couponProblem: string | null
  deliveryCharge: number
  freeDeliveryAbove: number
  amountForFreeDelivery: number | null
  total: number
  minOrderValue: number
  storeOpen: boolean
  upiId: string
  credit: { limit: number; outstanding: number; available: number } | null
  problems: string[]
  canPlaceOrder: boolean
}

export interface Address {
  id: string
  label: string
  fullName: string
  phone: string
  addressLine1: string
  addressLine2: string | null
  city: string
  state: string
  pincode: string
  isDefault: boolean
}

export interface AddressInput {
  label: string
  fullName: string
  phone: string
  addressLine1: string
  addressLine2: string | null
  city: string
  pincode: string
}

export type PaymentMethod = 'COD' | 'UPI' | 'CREDIT'

export type OrderStatus =
  | 'PLACED'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'PACKED'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED'

export type PaymentStatus = 'PENDING' | 'PENDING_VERIFICATION' | 'PAID' | 'FAILED' | 'REFUNDED'

export interface OrderSummary {
  id: string
  orderNumber: string
  status: OrderStatus
  paymentMethod: PaymentMethod | 'CASH'
  paymentStatus: PaymentStatus
  total: number
  totalCases: number
  createdAt: string
}

export interface OrderDetail {
  id: string
  orderNumber: string
  status: OrderStatus
  paymentMethod: PaymentMethod | 'CASH'
  paymentStatus: PaymentStatus
  paymentTerms: 'PREPAID' | 'CREDIT'
  subtotal: number
  couponCode: string | null
  discount: number
  deliveryCharge: number
  total: number
  totalCases: number
  address: Omit<Address, 'id' | 'isDefault'> | null
  notes: string | null
  createdAt: string
  items: { productId: string | null; productName: string; quantity: number; price: number; total: number }[]
}

// ---- Shop profile -----------------------------------------------------

/** The signed-in shop's delivery route, from /api/me/delivery-route. */
export interface MyDeliveryRoute {
  assigned: boolean
  name: string | null
  area: string | null
  days: string[]
  nextDeliveryDate: string | null
}

export interface ShopProfile {
  shopName: string | null
  ownerName: string | null
  phone: string | null
  gstNumber: string | null
  address: string | null
  city: string | null
  state: string | null
  pincode: string | null
  lat: number | null
  lng: number | null
  complete: boolean
}

export interface ShopProfileInput {
  shopName: string
  ownerName: string
  phone: string
  gstNumber: string | null
  address: string
  city: string
  state: string
  pincode: string
  lat: number
  lng: number
}
