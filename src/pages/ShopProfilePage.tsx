import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { ApiError } from '../api/client'
import { shopApi } from '../api/shop'
import type { ShopProfile } from '../api/types'
import { safeFrom } from '../auth/safeFrom'
import { useAuth } from '../auth/useAuth'
import { LocationPicker } from '../components/LocationPicker'
import { Button, ErrorBanner, Field, Spinner } from '../components/ui'
import { shopProfileErrors, type ShopProfileForm } from '../lib/shopProfileRules'

/** /profile/shop — shop details and map location. With ?from=, returns there after saving (used after sign-up). */
export function ShopProfilePage() {
  const profile = useQuery({ queryKey: ['shop-profile'], queryFn: shopApi.shopProfile })
  if (profile.isPending) {
    return (
      <div className="py-16 text-center">
        <Spinner />
      </div>
    )
  }
  if (profile.error) return <ErrorBanner message={profile.error.message} />
  return <ShopProfileEditor initial={profile.data} />
}

function ShopProfileEditor({ initial }: { initial: ShopProfile }) {
  const { state, refreshUser } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const from = params.get('from')
  const onboarding = from !== null

  const [form, setForm] = useState<ShopProfileForm>(() => ({
    shopName: initial.shopName ?? '',
    ownerName: initial.ownerName ?? (state.status === 'signed-in' ? (state.user.fullName ?? '') : ''),
    phone: initial.phone ?? (state.status === 'signed-in' ? (state.user.phone ?? '') : ''),
    gstNumber: initial.gstNumber ?? '',
    address: initial.address ?? '',
    city: initial.city ?? 'Hyderabad',
    pincode: initial.pincode ?? '',
    location: initial.lat !== null && initial.lng !== null ? { lat: initial.lat, lng: initial.lng } : null,
  }))
  const [errors, setErrors] = useState<Record<string, string>>({})

  const save = useMutation({
    mutationFn: () =>
      shopApi.saveShopProfile({
        shopName: form.shopName.trim(),
        ownerName: form.ownerName.trim(),
        phone: form.phone.trim(),
        gstNumber: form.gstNumber.trim() || null,
        address: form.address.trim(),
        city: form.city.trim(),
        state: 'Telangana',
        pincode: form.pincode.trim(),
        lat: form.location!.lat,
        lng: form.location!.lng,
      }),
    onSuccess: async (saved) => {
      queryClient.setQueryData(['shop-profile'], saved)
      // The first save also creates the default delivery address.
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
      // The new pin may put the shop on a different route.
      queryClient.invalidateQueries({ queryKey: ['delivery-route'] })
      await refreshUser()
      navigate(onboarding ? safeFrom(from) : '/profile', { replace: true })
    },
    onError: (e) => setErrors(e instanceof ApiError ? e.fieldErrors : {}),
  })

  function submit(event: FormEvent) {
    event.preventDefault()
    const problems = shopProfileErrors(form)
    setErrors(problems)
    if (Object.keys(problems).length === 0) save.mutate()
  }

  const set = (key: Exclude<keyof ShopProfileForm, 'location'>) => (value: string) => setForm((f) => ({ ...f, [key]: value }))

  return (
    <form onSubmit={submit} noValidate className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">{initial.complete ? 'Shop profile' : 'Complete your shop profile'}</h1>
        <p className="text-slate-600">We need this to deliver orders to your shop.</p>
      </div>
      <ErrorBanner message={save.error && Object.keys(errors).length === 0 ? save.error.message : null} />

      <section className="card space-y-3 p-4">
        <h2 className="font-semibold">Shop details</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Shop name *" error={errors.shopName}>
            <input className="input" value={form.shopName} onChange={(e) => set('shopName')(e.target.value)} autoComplete="organization" />
          </Field>
          <Field label="Owner name *" error={errors.ownerName}>
            <input className="input" value={form.ownerName} onChange={(e) => set('ownerName')(e.target.value)} autoComplete="name" />
          </Field>
          <Field label="Mobile *" error={errors.phone}>
            <input className="input" type="tel" value={form.phone} onChange={(e) => set('phone')(e.target.value)} autoComplete="tel" />
          </Field>
          <Field label="GSTIN (optional)" error={errors.gstNumber} hint="For GST invoices">
            <input className="input font-mono uppercase" maxLength={15} value={form.gstNumber} onChange={(e) => set('gstNumber')(e.target.value)} />
          </Field>
        </div>
      </section>

      <section className="card space-y-3 p-4">
        <h2 className="font-semibold">Shop location</h2>
        <LocationPicker value={form.location} onChange={(location) => setForm((f) => ({ ...f, location }))} />
        {errors.location && <p className="text-sm text-red-600">{errors.location}</p>}
        <Field label="Address / landmark *" error={errors.address}>
          <input className="input" value={form.address} onChange={(e) => set('address')(e.target.value)} autoComplete="street-address" placeholder="Shop no., street, area, landmark" />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="City *" error={errors.city}>
            <input className="input" value={form.city} onChange={(e) => set('city')(e.target.value)} autoComplete="address-level2" />
          </Field>
          <Field label="PIN code *" error={errors.pincode}>
            <input className="input" inputMode="numeric" maxLength={6} value={form.pincode} onChange={(e) => set('pincode')(e.target.value.replace(/\D/g, ''))} autoComplete="postal-code" />
          </Field>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" busy={save.isPending}>
          {initial.complete ? 'Save changes' : 'Save shop profile'}
        </Button>
        {onboarding ? (
          <Link to={safeFrom(from)} className="text-sm text-slate-600 hover:underline">
            Skip for now
          </Link>
        ) : (
          <Link to="/profile" className="text-sm text-slate-600 hover:underline">
            Cancel
          </Link>
        )}
      </div>
    </form>
  )
}
