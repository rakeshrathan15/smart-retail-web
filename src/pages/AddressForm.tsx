import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { ApiError } from '../api/client'
import { shopApi } from '../api/shop'
import type { Address, AddressInput } from '../api/types'
import { addressErrors } from '../lib/addressRules'
import { Button, ErrorBanner, Field } from '../components/ui'

const empty: AddressInput = { label: 'Shop', fullName: '', phone: '', addressLine1: '', addressLine2: null, city: 'Hyderabad', pincode: '' }

export function AddressForm({ onSaved, onCancel }: { onSaved: (address: Address) => void; onCancel?: () => void }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<AddressInput>(empty)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const save = useMutation({
    mutationFn: () =>
      shopApi.addAddress({
        ...form,
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        addressLine1: form.addressLine1.trim(),
        addressLine2: form.addressLine2?.trim() || null,
        city: form.city.trim(),
        pincode: form.pincode.trim(),
      }),
    onSuccess: (address) => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
      onSaved(address)
    },
    onError: (e) => setErrors(e instanceof ApiError ? e.fieldErrors : {}),
  })

  function submit(event: FormEvent) {
    event.preventDefault()
    const problems = addressErrors(form)
    setErrors(problems)
    if (Object.keys(problems).length === 0) save.mutate()
  }

  const set = (key: keyof AddressInput) => (value: string) => setForm((f) => ({ ...f, [key]: value }))

  return (
    <form onSubmit={submit} className="space-y-3" noValidate aria-label="New delivery address">
      <ErrorBanner message={save.error && Object.keys(errors).length === 0 ? save.error.message : null} />
      <div className="flex gap-2" role="group" aria-label="Address type">
        {['Shop', 'Godown', 'Home'].map((label) => (
          <button
            key={label}
            type="button"
            aria-pressed={form.label === label}
            onClick={() => set('label')(label)}
            className={`rounded-full px-3 py-1 text-sm ${form.label === label ? 'bg-brand text-white' : 'bg-white ring-1 ring-slate-300'}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Contact name" error={errors.fullName}>
          <input className="input" value={form.fullName} onChange={(e) => set('fullName')(e.target.value)} autoComplete="name" />
        </Field>
        <Field label="Mobile" error={errors.phone}>
          <input className="input" type="tel" value={form.phone} onChange={(e) => set('phone')(e.target.value)} autoComplete="tel" />
        </Field>
      </div>
      <Field label="Shop no., building, street" error={errors.addressLine1}>
        <input className="input" value={form.addressLine1} onChange={(e) => set('addressLine1')(e.target.value)} autoComplete="address-line1" />
      </Field>
      <Field label="Area, landmark (optional)">
        <input className="input" value={form.addressLine2 ?? ''} onChange={(e) => set('addressLine2')(e.target.value)} autoComplete="address-line2" />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="City" error={errors.city}>
          <input className="input" value={form.city} onChange={(e) => set('city')(e.target.value)} autoComplete="address-level2" />
        </Field>
        <Field label="PIN code" error={errors.pincode}>
          <input className="input" inputMode="numeric" maxLength={6} value={form.pincode} onChange={(e) => set('pincode')(e.target.value.replace(/\D/g, ''))} autoComplete="postal-code" />
        </Field>
      </div>
      <div className="flex gap-2">
        <Button type="submit" busy={save.isPending}>
          Save address
        </Button>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
