import { useState } from 'react'
import { MAX_CASES_PER_LINE } from '../cart/cart'

/** − [cases] + ; the number can also be typed. */
export function QuantityStepper({
  value,
  onChange,
  label,
  min = 1,
}: {
  value: number
  onChange: (value: number) => void
  label: string
  min?: number
}) {
  const [draft, setDraft] = useState<string | null>(null)

  function commit(text: string) {
    setDraft(null)
    const n = Number.parseInt(text, 10)
    if (Number.isFinite(n)) onChange(Math.min(Math.max(n, min), MAX_CASES_PER_LINE))
  }

  const button =
    'flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-lg hover:bg-slate-50 disabled:opacity-40'
  return (
    <div className="inline-flex items-center gap-2">
      <button type="button" className={button} aria-label={`One case less of ${label}`} disabled={value <= min} onClick={() => onChange(value - 1)}>
        −
      </button>
      <input
        className="w-14 rounded-md border border-slate-300 py-1 text-center text-base font-semibold"
        inputMode="numeric"
        aria-label={`Cases of ${label}`}
        value={draft ?? String(value)}
        onChange={(e) => setDraft(e.target.value.replace(/\D/g, ''))}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && commit((e.target as HTMLInputElement).value)}
      />
      <button
        type="button"
        className={button}
        aria-label={`One case more of ${label}`}
        disabled={value >= MAX_CASES_PER_LINE}
        onClick={() => onChange(value + 1)}
      >
        +
      </button>
    </div>
  )
}
