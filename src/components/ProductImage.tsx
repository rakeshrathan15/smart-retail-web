import { useState } from 'react'

const palette = ['#1e3a8a', '#b91c1c', '#047857', '#b45309', '#6d28d9', '#0e7490']

/** A product photo, or a coloured placeholder with the brand name when there is none (same as the app). */
export function ProductImage({ url, label, className = '' }: { url: string | null; label: string; className?: string }) {
  const [failed, setFailed] = useState(false)
  if (url && !failed) {
    return <img src={url} alt="" loading="lazy" onError={() => setFailed(true)} className={`object-cover ${className}`} />
  }
  const color = palette[[...label].reduce((sum, c) => sum + c.charCodeAt(0), 0) % palette.length]
  return (
    <div
      aria-hidden="true"
      className={`flex flex-col items-center justify-center gap-1 text-white ${className}`}
      style={{ background: `linear-gradient(135deg, ${color}, color-mix(in srgb, ${color} 65%, black))` }}
    >
      <svg viewBox="0 0 24 24" className="h-1/4 max-h-12 w-auto opacity-70" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M6 3h12l-1.6 17a1 1 0 0 1-1 .9H8.6a1 1 0 0 1-1-.9L6 3Z" />
        <path d="M6.5 8h11" />
      </svg>
      <span className="max-w-[90%] truncate px-2 text-xs font-bold tracking-wide uppercase">{label}</span>
    </div>
  )
}
