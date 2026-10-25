import { useState, type FormEvent } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router'
import { ApiError } from '../api/client'
import { safeFrom } from '../auth/safeFrom'
import { useAuth } from '../auth/useAuth'
import { Button, ErrorBanner, Field } from '../components/ui'

function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-sm py-6">
      <div className="card space-y-4 p-6">
        <div className="text-center">
          <img src="/favicon.svg" alt="" className="mx-auto mb-2 h-12 w-12" />
          <h1 className="text-xl font-semibold">{title}</h1>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  )
}

/** ?from= is where to go after signing in (e.g. /checkout). Defaults to the home page. */
function useReturnTo() {
  const [params] = useSearchParams()
  const from = params.get('from')
  return { target: safeFrom(from), query: from ? `?from=${encodeURIComponent(from)}` : '' }
}

export function LoginPage() {
  const { state, login } = useAuth()
  const { target, query } = useReturnTo()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (state.status === 'signed-in') return <Navigate to={target} replace />

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await login(identifier.trim(), password)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not sign in')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthCard title="Welcome back" subtitle="Sign in to order for your shop">
      <form onSubmit={submit} className="space-y-4">
        <ErrorBanner message={error} />
        <Field label="Email or mobile">
          <input className="input" value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoComplete="username" required autoFocus />
        </Field>
        <Field label="Password">
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </Field>
        <Button type="submit" busy={busy} className="w-full py-2.5">
          Sign in
        </Button>
      </form>
      <p className="text-center text-sm">
        New shop?{' '}
        <Link to={`/register${query}`} className="font-medium text-brand hover:underline">
          Create an account
        </Link>
      </p>
    </AuthCard>
  )
}

/** Same rules as the backend. Returns errors by field. */
function registerErrors(f: { fullName: string; phone: string; email: string; password: string }): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!f.fullName.trim()) errors.fullName = 'Enter your name'
  const digits = f.phone.replace(/\D/g, '')
  if (!digits && !f.email.trim()) errors.phone = 'Enter a mobile number or an email'
  else if (digits && !/^[6-9]\d{9}$/.test(digits.replace(/^(91|0)(?=\d{10}$)/, ''))) errors.phone = 'Enter a valid 10-digit mobile number'
  if (f.email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.trim())) errors.email = 'Enter a valid email'
  if (f.password.length < 8) errors.password = 'Use at least 8 characters'
  return errors
}

export function RegisterPage() {
  const { state, register } = useAuth()
  const { target, query } = useReturnTo()
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', password: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [justRegistered, setJustRegistered] = useState(false)

  // A new account fills in the shop profile next, then continues to where it was going.
  if (state.status === 'signed-in') {
    return <Navigate to={justRegistered ? `/profile/shop?from=${encodeURIComponent(target)}` : target} replace />
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    const problems = registerErrors(form)
    setErrors(problems)
    setError(null)
    if (Object.keys(problems).length > 0) return
    setBusy(true)
    setJustRegistered(true)
    try {
      await register({
        fullName: form.fullName.trim(),
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        password: form.password,
      })
    } catch (e) {
      setJustRegistered(false)
      if (e instanceof ApiError) {
        setErrors(e.fieldErrors)
        if (Object.keys(e.fieldErrors).length === 0) setError(e.message)
      } else {
        setError('Could not create the account')
      }
    } finally {
      setBusy(false)
    }
  }

  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }))
  return (
    <AuthCard title="Create account" subtitle="Order cases for your shop at bulk prices">
      <form onSubmit={submit} className="space-y-3" noValidate>
        <ErrorBanner message={error} />
        <Field label="Your name" error={errors.fullName}>
          <input className="input" value={form.fullName} onChange={(e) => set('fullName')(e.target.value)} autoComplete="name" autoFocus />
        </Field>
        <Field label="Mobile number" error={errors.phone}>
          <input className="input" type="tel" value={form.phone} onChange={(e) => set('phone')(e.target.value)} autoComplete="tel" placeholder="10-digit mobile" />
        </Field>
        <Field label="Email (optional)" error={errors.email}>
          <input className="input" type="email" value={form.email} onChange={(e) => set('email')(e.target.value)} autoComplete="email" />
        </Field>
        <Field label="Password" error={errors.password} hint="At least 8 characters">
          <input className="input" type="password" value={form.password} onChange={(e) => set('password')(e.target.value)} autoComplete="new-password" />
        </Field>
        <Button type="submit" busy={busy} className="w-full py-2.5">
          Create account
        </Button>
      </form>
      <p className="text-center text-sm">
        Already have an account?{' '}
        <Link to={`/login${query}`} className="font-medium text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </AuthCard>
  )
}
