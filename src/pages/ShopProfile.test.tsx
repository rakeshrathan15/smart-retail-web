import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearTokens } from '../api/client'
import { shopProfileErrors } from '../lib/shopProfileRules'
import { fakeBackend } from '../test/fakeBackend'
import { auth, catalogRoutes, renderApp, user } from '../test/renderApp'

// The real map needs a browser with layout; here a button stands in for tapping the map.
vi.mock('../components/LocationPicker', () => ({
  LocationPicker: ({ value, onChange }: { value: unknown; onChange: (v: { lat: number; lng: number }) => void }) => (
    <button type="button" onClick={() => onChange({ lat: 17.4374, lng: 78.4482 })}>
      {value ? 'Pin placed' : 'Place pin'}
    </button>
  ),
}))

const emptyProfile = {
  shopName: null,
  ownerName: 'Ravi Kumar',
  phone: '9876543210',
  gstNumber: null,
  address: null,
  city: null,
  state: null,
  pincode: null,
  lat: null,
  lng: null,
  complete: false,
}

describe('shop profile', () => {
  afterEach(() => {
    clearTokens()
    vi.unstubAllGlobals()
  })

  it('checks the same rules as the backend', () => {
    const ok = {
      shopName: 'Lakshmi Kirana',
      ownerName: 'Ravi',
      phone: '9876543210',
      gstNumber: '',
      address: '4-1-20 Main Road',
      city: 'Hyderabad',
      pincode: '500016',
      location: { lat: 17.43, lng: 78.44 },
    }
    expect(shopProfileErrors(ok)).toEqual({})
    expect(shopProfileErrors({ ...ok, gstNumber: '36abcde1234f1z5' })).toEqual({})
    expect(Object.keys(shopProfileErrors({ ...ok, location: null, pincode: '500', gstNumber: 'BAD' })).sort()).toEqual([
      'gstNumber',
      'location',
      'pincode',
    ])
    expect(shopProfileErrors({ ...ok, location: { lat: 78.44, lng: 17.43 } }).location).toBe('The pin must be in India')
  })

  it('asks a new account for its shop and location, then continues', async () => {
    let saved: Record<string, unknown> | null = null
    let complete = false
    fakeBackend({
      ...catalogRoutes,
      'POST /api/auth/register': () => ({ status: 201, body: auth }),
      'GET /api/me/shop-profile': () => ({ status: 200, body: emptyProfile }),
      'PUT /api/me/shop-profile': ({ body }) => {
        saved = body as Record<string, unknown>
        complete = true
        return { status: 200, body: { ...saved, complete: true } }
      },
      'GET /api/me': () => ({ status: 200, body: { ...user, shopProfileComplete: complete } }),
    })
    const ux = userEvent.setup()
    renderApp('/register')

    await ux.type(await screen.findByLabelText('Your name'), 'Ravi Kumar')
    await ux.type(screen.getByLabelText('Mobile number'), '9876543210')
    await ux.type(screen.getByLabelText(/^Password/), 'secret123')
    await ux.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByRole('heading', { name: 'Complete your shop profile' })).toBeInTheDocument()
    expect(screen.getByLabelText('Owner name *')).toHaveValue('Ravi Kumar')
    expect(screen.getByRole('link', { name: 'Skip for now' })).toBeInTheDocument()

    // Saving without a pin points at the map.
    await ux.type(screen.getByLabelText('Shop name *'), 'Lakshmi Kirana')
    await ux.click(screen.getByRole('button', { name: 'Save shop profile' }))
    expect(screen.getByText('Place the pin on your shop')).toBeInTheDocument()
    expect(saved).toBeNull()

    await ux.click(screen.getByRole('button', { name: 'Place pin' }))
    await ux.type(screen.getByLabelText(/^Address \/ landmark \*/), '4-1-20, Main Road, Ameerpet')
    await ux.type(screen.getByLabelText(/^PIN code \*/), '500016')
    await ux.type(screen.getByLabelText(/^GSTIN \(optional\)/), '36abcde1234f1z5')
    await ux.click(screen.getByRole('button', { name: 'Save shop profile' }))

    await waitFor(() =>
      expect(saved).toEqual({
        shopName: 'Lakshmi Kirana',
        ownerName: 'Ravi Kumar',
        phone: '9876543210',
        gstNumber: '36abcde1234f1z5',
        address: '4-1-20, Main Road, Ameerpet',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500016',
        lat: 17.4374,
        lng: 78.4482,
      }),
    )
    // Back to where the visitor was heading (the home page here).
    expect(await screen.findByRole('heading', { name: 'Shop by category' })).toBeInTheDocument()
  })
})
