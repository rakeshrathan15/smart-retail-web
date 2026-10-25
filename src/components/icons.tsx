// Small inline icons, so the site needs no icon font. Decorative: screen readers use the labels next to them.
const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

export const HomeIcon = ({ className = 'h-5 w-5' }) => (
  <svg {...base} className={className}>
    <path d="M3 11.5 12 4l9 7.5M5.5 9.5V20h13V9.5" />
  </svg>
)

export const ShopIcon = ({ className = 'h-5 w-5' }) => (
  <svg {...base} className={className}>
    <path d="M4 9h16l-1-5H5L4 9Zm0 0v11h16V9M9 20v-6h6v6" />
  </svg>
)

export const CartIcon = ({ className = 'h-5 w-5' }) => (
  <svg {...base} className={className}>
    <path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h9.2a1 1 0 0 0 1-.8L20 8H6.2" />
    <circle cx="9.5" cy="20" r="1.2" />
    <circle cx="17" cy="20" r="1.2" />
  </svg>
)

export const OrdersIcon = ({ className = 'h-5 w-5' }) => (
  <svg {...base} className={className}>
    <path d="M7 3h10a1 1 0 0 1 1 1v17l-3-2-3 2-3-2-3 2V4a1 1 0 0 1 1-1Zm2 5h6M9 12h6" />
  </svg>
)

export const UserIcon = ({ className = 'h-5 w-5' }) => (
  <svg {...base} className={className}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </svg>
)

export const SearchIcon = ({ className = 'h-5 w-5' }) => (
  <svg {...base} className={className}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
)

export const PinIcon = ({ className = 'h-4 w-4' }) => (
  <svg {...base} className={className}>
    <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </svg>
)
