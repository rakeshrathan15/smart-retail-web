import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { shopApi } from '../api/shop'
import { useAuth } from '../auth/useAuth'
import { Button } from '../components/ui'

export function ProfilePage() {
  const { state, logout } = useAuth()
  const addresses = useQuery({ queryKey: ['addresses'], queryFn: shopApi.addresses })
  if (state.status !== 'signed-in') return null
  const user = state.user

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center gap-4">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-light text-xl font-semibold text-brand" aria-hidden="true">
          {(user.fullName ?? '?').charAt(0).toUpperCase()}
        </span>
        <div>
          <h1 className="text-xl font-semibold">{user.fullName ?? 'Shop owner'}</h1>
          <div className="text-sm text-slate-500">{user.roles.join(', ').toLowerCase()}</div>
        </div>
      </div>

      {user.shopProfileComplete ? (
        <ShopCard />
      ) : (
        <Link to="/profile/shop" className="block rounded-lg border border-brand-light bg-brand-light/40 p-4 text-sm hover:border-brand">
          <div className="font-medium">Complete your shop profile →</div>
          Shop name, GSTIN and your shop's location on the map, needed for delivery.
        </Link>
      )}

      <dl className="card divide-y divide-slate-100 text-sm">
        <div className="flex justify-between p-4">
          <dt className="text-slate-500">Mobile</dt>
          <dd>{user.phone ? `+91 ${user.phone}` : 'Not added'}</dd>
        </div>
        <div className="flex justify-between p-4">
          <dt className="text-slate-500">Email</dt>
          <dd>{user.email ?? 'Not added'}</dd>
        </div>
      </dl>

      <section className="card p-4 text-sm">
        <h2 className="mb-2 font-semibold">Delivery addresses</h2>
        {addresses.data?.length === 0 && <p className="text-slate-500">None yet. You can add one at checkout.</p>}
        <ul className="space-y-2">
          {addresses.data?.map((a) => (
            <li key={a.id}>
              <span className="font-medium">
                {a.label} · {a.fullName}
              </span>
              {a.isDefault && <span className="ml-2 text-xs text-green-700">Default</span>}
              <div className="text-slate-600">{[a.addressLine1, a.addressLine2, `${a.city} ${a.pincode}`].filter(Boolean).join(', ')}</div>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex gap-3">
        <Link to="/orders" className="rounded-md px-4 py-2 text-sm font-medium text-brand ring-1 ring-brand hover:bg-brand-light">
          My orders
        </Link>
        <Button variant="danger" onClick={logout}>
          Sign out
        </Button>
      </div>
    </div>
  )
}

function ShopCard() {
  const profile = useQuery({ queryKey: ['shop-profile'], queryFn: shopApi.shopProfile })
  const p = profile.data
  return (
    <section className="card p-4 text-sm">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="font-semibold">Shop</h2>
        <Link to="/profile/shop" className="text-brand hover:underline">
          Edit
        </Link>
      </div>
      {p && (
        <>
          <div className="font-medium">{p.shopName}</div>
          <div className="text-slate-600">{[p.address, `${p.city ?? ''} ${p.pincode ?? ''}`.trim()].filter(Boolean).join(', ')}</div>
          {p.gstNumber && <div className="text-slate-600">GSTIN {p.gstNumber}</div>}
          {p.lat !== null && p.lng !== null && (
            <a
              className="text-brand hover:underline"
              href={`https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lng}#map=18/${p.lat}/${p.lng}`}
              target="_blank"
              rel="noreferrer"
            >
              View location on map
            </a>
          )}
          <DeliveryRouteLine />
        </>
      )}
    </section>
  )
}

const dayNames: Record<string, string> = { MON: 'Mon', TUE: 'Tue', WED: 'Wed', THU: 'Thu', FRI: 'Fri', SAT: 'Sat', SUN: 'Sun' }

const deliveryDay = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'UTC' })

function DeliveryRouteLine() {
  const route = useQuery({ queryKey: ['delivery-route'], queryFn: shopApi.deliveryRoute })
  const r = route.data
  if (!r) return null
  if (!r.assigned) {
    return <p className="mt-2 border-t border-slate-100 pt-2 text-slate-600">Your shop is not on a delivery route yet.</p>
  }
  return (
    <div className="mt-2 border-t border-slate-100 pt-2">
      <div className="font-medium">Delivery route: {r.name}</div>
      {r.days.length > 0 && <div className="text-slate-600">{r.days.map((d) => dayNames[d] ?? d).join(', ')}</div>}
      {r.nextDeliveryDate && (
        <div className="text-slate-600">Order today, delivered {deliveryDay.format(new Date(`${r.nextDeliveryDate}T00:00:00Z`))}</div>
      )}
    </div>
  )
}
