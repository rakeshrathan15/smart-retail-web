import { describe, expect, it } from 'vitest'
import { safeFrom } from '../auth/safeFrom'
import { addressErrors } from './addressRules'
import { discountPercent, formatRupees, packSize, pricePerCaseFor, slabRows } from './format'

const cola = {
  price: 420,
  slabs: [
    { minQty: 10, maxQty: 24, pricePerCase: 378 },
    { minQty: 25, maxQty: null, pricePerCase: 357 },
  ],
}

describe('pricing and formatting', () => {
  it('applies the highest slab reached, like the backend', () => {
    expect([1, 9, 10, 24, 25, 300].map((n) => pricePerCaseFor(cola, n))).toEqual([420, 420, 378, 378, 357, 357])
    expect(pricePerCaseFor({ price: 240, slabs: [] }, 100)).toBe(240)
  })

  it('lists bulk price rows including the base price row', () => {
    expect(slabRows(cola)).toEqual([
      { min: 1, max: 9, price: 420 },
      { min: 10, max: 24, price: 378 },
      { min: 25, max: null, price: 357 },
    ])
    expect(slabRows({ price: 240, slabs: [] })).toEqual([])
  })

  it('formats rupees, pack sizes and discounts', () => {
    expect(formatRupees(1440)).toBe('₹1,440')
    expect(formatRupees(150000)).toBe('₹1,50,000')
    expect(formatRupees(378.5)).toBe('₹378.50')
    expect(packSize(750, 12)).toBe('750ml × 12/case')
    expect(packSize(1000, 12)).toBe('1L × 12/case')
    expect(packSize(null, 6)).toBe('6/case')
    expect(discountPercent({ price: 420, originalPrice: 480 })).toBe(13)
    expect(discountPercent({ price: 420, originalPrice: null })).toBeNull()
  })
})

describe('form rules', () => {
  it('checks addresses like the backend', () => {
    const ok = { label: 'Shop', fullName: 'Ravi', phone: '+91 98765 01234', addressLine1: '12 Main Rd', addressLine2: null, city: 'Hyderabad', pincode: '500001' }
    expect(addressErrors(ok)).toEqual({})
    expect(Object.keys(addressErrors({ ...ok, phone: '12345', pincode: '5000', fullName: ' ' })).sort()).toEqual(['fullName', 'phone', 'pincode'])
  })

  it('only returns to pages on this site after sign-in', () => {
    expect(safeFrom('/checkout')).toBe('/checkout')
    expect(safeFrom('/shop?category=colas')).toBe('/shop?category=colas')
    expect(safeFrom('//evil.example')).toBe('/')
    expect(safeFrom('https://evil.example')).toBe('/')
    expect(safeFrom('/login')).toBe('/')
    expect(safeFrom(null)).toBe('/')
  })
})
