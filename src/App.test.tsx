import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearTokens, saveTokens } from './api/client'
import { cart, couponCode } from './cart/cart'
import { fakeBackend } from './test/fakeBackend'
import { auth, catalogRoutes, detail, quoteFor, renderApp, user } from './test/renderApp'

const address = {
  id: 'a1',
  label: 'Shop',
  fullName: 'Ravi Kumar',
  phone: '9876501234',
  addressLine1: '12 Main Road',
  addressLine2: null,
  city: 'Hyderabad',
  state: 'Telangana',
  pincode: '500001',
  isDefault: true,
}

function order(body: Record<string, unknown>) {
  return {
    id: 'o1',
    orderNumber: 'SR1001',
    status: 'PLACED',
    paymentMethod: body.paymentMethod,
    paymentStatus: body.paymentMethod === 'UPI' ? 'PENDING_VERIFICATION' : 'PENDING',
    paymentTerms: 'PREPAID',
    subtotal: 3780,
    couponCode: body.couponCode,
    discount: 189,
    deliveryCharge: 500,
    total: body.expectedTotal,
    totalCases: 10,
    address: { ...address, id: undefined, isDefault: undefined },
    notes: null,
    createdAt: '2026-10-25T11:59:00Z',
    items: [{ productId: 'p1', productName: 'Thums Up 750ml PET', quantity: 10, price: 378, total: 3780 }],
  }
}

describe('website', () => {
  beforeEach(() => {
    cart.reload()
    couponCode.set(null)
  })
  afterEach(() => {
    clearTokens()
    vi.unstubAllGlobals()
  })

  it('lets visitors browse, see bulk prices and fill a cart without an account', async () => {
    const calls = fakeBackend(catalogRoutes)
    const ux = userEvent.setup()
    renderApp('/')

    expect(await screen.findByRole('heading', { name: 'Bulk case pricing' })).toBeInTheDocument()
    expect(screen.getByText('Open for orders')).toBeInTheDocument()
    expect(screen.getAllByText('13% OFF').length).toBeGreaterThan(0)
    expect(screen.getAllByText('as low as ₹357').length).toBeGreaterThan(0)

    await ux.click(screen.getAllByRole('link', { name: /Thums Up 750ml PET/ })[0])
    expect(await screen.findByRole('heading', { name: 'Thums Up 750ml PET' })).toBeInTheDocument()
    expect(screen.getByText('1–9 cases')).toBeInTheDocument()

    for (let i = 0; i < 9; i++) await ux.click(screen.getByRole('button', { name: 'One case more of Thums Up 750ml PET' }))
    expect(screen.getByText('₹3,780')).toBeInTheDocument() // 10 × ₹378
    expect(screen.getByText('10–24 cases').closest('tr')).toHaveAttribute('aria-current', 'true')

    await ux.click(screen.getByRole('button', { name: 'Add 10 cases to cart' }))
    expect(screen.getByRole('status')).toHaveTextContent('Added 10 cases to your cart.')
    expect(screen.getByRole('link', { name: 'Cart, 10 cases' })).toBeInTheDocument()

    await ux.click(screen.getByRole('link', { name: 'View cart' }))
    expect(await screen.findByText('Add ₹1,220 more for free delivery')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign in to checkout' })).toBeEnabled()
    // Real server prices for visitors, without sending any login.
    expect(calls.find((c) => c.path === '/api/checkout/quote')?.auth).toBeUndefined()
  })

  it('signs in from the cart, returns to checkout and places a UPI order', async () => {
    cart.add(detail as never, 10)
    let placed: Record<string, unknown> | null = null
    fakeBackend({
      ...catalogRoutes,
      'POST /api/auth/login': () => ({ status: 200, body: auth }),
      'POST /api/checkout/quote': ({ body }) => ({ status: 200, body: quoteFor(body as never, null) }),
      'GET /api/me/addresses': () => ({ status: 200, body: [address] }),
      'POST /api/me/payment-screenshots': () => ({ status: 201, body: { reference: 'payments/abc.png' } }),
      'POST /api/orders': ({ body }) => {
        placed = body as Record<string, unknown>
        return { status: 201, body: order(placed) }
      },
      'GET /api/me/orders/o1': () => ({ status: 200, body: order({ paymentMethod: 'UPI', couponCode: 'SAVE5', expectedTotal: 4091 }) }),
    })
    const ux = userEvent.setup()
    renderApp('/cart')

    await ux.type(await screen.findByLabelText('Coupon code'), 'save5')
    await ux.click(screen.getByRole('button', { name: 'Apply' }))
    expect(await screen.findByText('You save ₹189')).toBeInTheDocument()

    await ux.click(screen.getByRole('button', { name: 'Sign in to checkout' }))
    await ux.type(await screen.findByLabelText('Email or mobile'), '9876543210')
    await ux.type(screen.getByLabelText('Password'), 'secret123')
    await ux.click(screen.getByRole('button', { name: 'Sign in' }))

    // Back on checkout, with the cart and coupon kept.
    expect(await screen.findByRole('heading', { name: 'Checkout' })).toBeInTheDocument()
    expect(await screen.findByText('Shop · Ravi Kumar')).toBeInTheDocument()
    expect(screen.getByText('Not enabled for your shop')).toBeInTheDocument()

    await ux.click(screen.getByRole('radio', { name: /UPI/ }))
    expect(screen.getByText('smartretail@upi')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Upload the UPI screenshot' })).toBeDisabled()
    await ux.upload(screen.getByLabelText('UPI payment screenshot'), new File(['png'], 'paid.png', { type: 'image/png' }))
    expect(await screen.findByText(/paid\.png/)).toBeInTheDocument()

    await ux.click(screen.getByRole('button', { name: 'Place order · ₹4,091' }))
    expect(await screen.findByRole('heading', { name: 'Order placed!' })).toBeInTheDocument()
    expect(screen.getByText('Order number SR1001')).toBeInTheDocument()
    expect(screen.getByText('We will check your UPI payment and confirm the order.')).toBeInTheDocument()
    expect(placed).toEqual({
      items: [{ productId: 'p1', quantity: 10 }],
      couponCode: 'SAVE5',
      addressId: 'a1',
      paymentMethod: 'UPI',
      paymentScreenshot: 'payments/abc.png',
      notes: null,
      expectedTotal: 4091,
    })
    expect(cart.lines()).toEqual([])
  })

  it('shows why the server refused an order and keeps the cart', async () => {
    saveTokens(auth)
    cart.add(detail as never, 10)
    fakeBackend({
      ...catalogRoutes,
      'GET /api/me': () => ({ status: 200, body: user }),
      'GET /api/me/addresses': () => ({ status: 200, body: [address] }),
      'POST /api/orders': () => ({ status: 409, body: { detail: 'Only 3 cases of Thums Up 750ml PET are left.' } }),
    })
    const ux = userEvent.setup()
    renderApp('/checkout')

    await ux.click(await screen.findByRole('button', { name: 'Place order · ₹4,280' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Only 3 cases of Thums Up 750ml PET are left.')
    expect(cart.lines()).toHaveLength(1)
  })

  it('sends visitors to sign in for their orders and blocks small carts', async () => {
    fakeBackend(catalogRoutes)
    renderApp('/orders')
    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()

    cart.add(detail as never, 2)
    const second = renderApp('/cart')
    const summary = await within(second.container).findByText(/Minimum order is ₹1,000\. Add ₹160 more\./)
    expect(summary).toBeInTheDocument()
    await waitFor(() => expect(within(second.container).getByRole('button', { name: 'Sign in to checkout' })).toBeDisabled())
  })
})
