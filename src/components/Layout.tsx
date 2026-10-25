import { useQuery } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { shopApi } from '../api/shop'
import { useAuth } from '../auth/useAuth'
import { useCartCount } from '../cart/cart'
import { CartIcon, HomeIcon, OrdersIcon, SearchIcon, ShopIcon, UserIcon } from './icons'

/** Header with search and cart on every page; on phones a bottom bar like the app. */
export function Layout() {
  const { state } = useAuth()
  const navigate = useNavigate()
  const cases = useCartCount()
  const settings = useQuery({ queryKey: ['settings'], queryFn: shopApi.settings, staleTime: 60_000 })
  const storeName = settings.data?.store_name || "S'Mart Retail"
  const [search, setSearch] = useState('')

  function submitSearch(event: FormEvent) {
    event.preventDefault()
    navigate(search.trim() ? `/shop?q=${encodeURIComponent(search.trim())}` : '/shop')
  }

  const desktopLink = ({ isActive }: { isActive: boolean }) =>
    `rounded-md px-3 py-2 text-sm ${isActive ? 'bg-white/15 font-medium' : 'text-white/85 hover:bg-white/10'}`

  return (
    <div className="flex min-h-screen flex-col pb-16 md:pb-0">
      <header className="sticky top-0 z-20 bg-brand text-white shadow">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link to="/" className="flex shrink-0 items-center gap-2">
            <img src="/favicon.svg" alt="" className="h-8 w-8" />
            <span className="font-semibold">{storeName}</span>
          </Link>
          <form onSubmit={submitSearch} role="search" className="hidden flex-1 md:block">
            <label className="relative block max-w-md">
              <span className="sr-only">Search products</span>
              <SearchIcon className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
              <input
                className="w-full rounded-md border-0 bg-white py-2 pr-3 pl-9 text-sm text-slate-900 placeholder:text-slate-400"
                placeholder="Search colas, juices, water…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
          </form>
          <nav className="ml-auto hidden items-center gap-1 md:flex" aria-label="Main">
            <NavLink to="/" end className={desktopLink}>
              Home
            </NavLink>
            <NavLink to="/shop" className={desktopLink}>
              Shop
            </NavLink>
            <NavLink to="/orders" className={desktopLink}>
              My orders
            </NavLink>
            <NavLink to="/cart" className={desktopLink} aria-label={`Cart, ${cases} cases`}>
              <span className="relative inline-flex items-center gap-1">
                <CartIcon />
                Cart
                {cases > 0 && <CountBadge count={cases} />}
              </span>
            </NavLink>
            {state.status === 'signed-in' ? (
              <NavLink to="/profile" className={desktopLink}>
                <span className="inline-flex items-center gap-1">
                  <UserIcon /> {state.user.fullName?.split(' ')[0] ?? 'Account'}
                </span>
              </NavLink>
            ) : (
              <Link to="/login" className="ml-1 rounded-md bg-white px-3 py-2 text-sm font-medium text-brand hover:bg-brand-light">
                Sign in
              </Link>
            )}
          </nav>
          {state.status === 'signed-out' && (
            <Link to="/login" className="ml-auto rounded-md bg-white px-3 py-1.5 text-sm font-medium text-brand md:hidden">
              Sign in
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5">
        <Outlet />
      </main>

      <footer className="mt-8 border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-2 px-4 py-6 text-sm text-slate-600 sm:grid-cols-2">
          <div>
            <div className="font-semibold text-slate-900">{storeName}</div>
            {settings.data?.store_address && <div>{settings.data.store_address}</div>}
            {settings.data?.store_phone && <div>Phone: {settings.data.store_phone}</div>}
            {settings.data?.store_email && <div>Email: {settings.data.store_email}</div>}
          </div>
          {settings.data?.show_certifications !== 'false' && (
            <div className="sm:text-right">
              {settings.data?.fssai_number && <div>FSSAI: {settings.data.fssai_number}</div>}
              {settings.data?.gst_number && <div>GSTIN: {settings.data.gst_number}</div>}
            </div>
          )}
        </div>
      </footer>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-slate-200 bg-white text-xs md:hidden"
      >
        <BottomLink to="/" end label="Home" icon={<HomeIcon />} />
        <BottomLink to="/shop" label="Shop" icon={<ShopIcon />} />
        <BottomLink
          to="/cart"
          label="Cart"
          icon={
            <span className="relative">
              <CartIcon />
              {cases > 0 && <CountBadge count={cases} />}
            </span>
          }
        />
        <BottomLink to="/orders" label="Orders" icon={<OrdersIcon />} />
        <BottomLink to="/profile" label="Profile" icon={<UserIcon />} />
      </nav>
    </div>
  )
}

function CountBadge({ count }: { count: number }) {
  return (
    <span className="absolute -top-2 -right-3 min-w-5 rounded-full bg-accent px-1 text-center text-[11px] leading-5 font-bold text-white">
      {count > 99 ? '99+' : count}
    </span>
  )
}

function BottomLink({ to, label, icon, end = false }: { to: string; label: string; icon: React.ReactNode; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => `flex flex-col items-center gap-0.5 py-2 ${isActive ? 'text-brand' : 'text-slate-500'}`}
    >
      {icon}
      {label}
    </NavLink>
  )
}
