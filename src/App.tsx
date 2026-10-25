import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router'
import { RequireAuth } from './auth/RequireAuth'
import { Layout } from './components/Layout'
import { LoginPage, RegisterPage } from './pages/AuthPages'
import { CartPage } from './pages/CartPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { HomePage } from './pages/HomePage'
import { OrderDetailPage, OrdersPage } from './pages/OrdersPage'
import { ProductPage } from './pages/ProductPage'
import { ProfilePage } from './pages/ProfilePage'
import { ShopPage } from './pages/ShopPage'
import { Spinner } from './components/ui'

// The map library is large and only this page needs it, so it loads when the page is opened.
const ShopProfilePage = lazy(() => import('./pages/ShopProfilePage').then((m) => ({ default: m.ShopProfilePage })))

/** Home, shop, products and cart are open to everyone; checkout, orders and profile need an account. */
export function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="shop" element={<ShopPage />} />
          <Route path="product/:slug" element={<ProductPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="checkout" element={<RequireAuth><CheckoutPage /></RequireAuth>} />
          <Route path="orders" element={<RequireAuth><OrdersPage /></RequireAuth>} />
          <Route path="orders/:id" element={<RequireAuth><OrderDetailPage /></RequireAuth>} />
          <Route path="profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
          <Route
            path="profile/shop"
            element={
              <RequireAuth>
                <Suspense fallback={<div className="py-16 text-center"><Spinner /></div>}>
                  <ShopProfilePage />
                </Suspense>
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </>
  )
}

/** A new page starts at the top, like a normal website. */
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}
