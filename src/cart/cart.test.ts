import { describe, expect, it } from 'vitest'
import type { ProductDetail } from '../api/types'
import { detail } from '../test/renderApp'
import { cart, MAX_CASES_PER_LINE } from './cart'

const product = detail as ProductDetail

describe('cart', () => {
  it('adds, merges repeat adds and survives a page reload', () => {
    cart.reload()
    cart.add(product, 4)
    cart.add(product, 6)
    expect(cart.lines()).toHaveLength(1)
    expect(cart.lines()[0]).toMatchObject({ productId: 'p1', quantity: 10, slug: 'thums-up-750ml-pet' })

    // A fresh page load reads the saved cart back.
    cart.reload()
    expect(cart.lines()[0].quantity).toBe(10)
  })

  it('keeps quantities in range and removes at zero', () => {
    cart.reload()
    cart.add(product, 1)
    cart.setQuantity('p1', 50_000)
    expect(cart.lines()[0].quantity).toBe(MAX_CASES_PER_LINE)
    cart.setQuantity('p1', 0)
    expect(cart.lines()).toEqual([])
  })

  it('ignores a corrupt saved cart instead of crashing', () => {
    localStorage.setItem('smart-retail-web.cart.v1', '{not json')
    cart.reload()
    expect(cart.lines()).toEqual([])
  })
})
