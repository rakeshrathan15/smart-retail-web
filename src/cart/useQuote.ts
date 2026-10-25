import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { shopApi } from '../api/shop'
import { useAuth } from '../auth/useAuth'
import { useCart, useCouponCode } from './cart'

/**
 * The server's price for the cart and coupon. Fetched again whenever either changes, keeping the
 * previous numbers on screen meanwhile. Signed-in users also get their credit.
 */
export function useQuote() {
  const lines = useCart()
  const coupon = useCouponCode()
  const { state } = useAuth()
  const items = lines.map((l) => ({ productId: l.productId, quantity: l.quantity }))
  const user = state.status === 'signed-in' ? state.user.id : null
  return useQuery({
    queryKey: ['quote', user, items, coupon],
    queryFn: () => shopApi.quote(items, coupon),
    enabled: lines.length > 0 && state.status !== 'loading',
    placeholderData: keepPreviousData,
  })
}
