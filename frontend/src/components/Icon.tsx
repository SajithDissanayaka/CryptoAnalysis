import type { CSSProperties } from 'react'

export type IconName =
  | 'overview'
  | 'sparkles'
  | 'library'
  | 'arrow'
  | 'up'
  | 'down'
  | 'chevron'
  | 'search'
  | 'bell'
  | 'plus'
  | 'close'
  | 'menu'
  | 'logout'
  | 'refresh'
  | 'download'
  | 'star'
  | 'upload'
  | 'file'
  | 'check'
  | 'trash'
  | 'external'
  | 'send'
  | 'globe'
  | 'clock'
  | 'eye'
  | 'eyeOff'
  | 'info'
const paths: Record<IconName, React.ReactNode> = {
  overview: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  sparkles: (
    <>
      <path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z" />
      <path d="m20 2 .6 1.4L22 4l-1.4.6L20 6l-.6-1.4L18 4l1.4-.6L20 2Z" />
    </>
  ),
  library: (
    <>
      <path d="M4 5v15M9 5v15M14 5v15M18 5l3 15M3 20h19M3 5h12" />
      <path d="M4 9h5m0 7h5" />
    </>
  ),
  arrow: (
    <>
      <path d="M5 12h14m-6-6 6 6-6 6" />
    </>
  ),
  up: (
    <>
      <path d="m7 17 10-10M7 7h10v10" />
    </>
  ),
  down: (
    <>
      <path d="m7 7 10 10M7 17h10V7" />
    </>
  ),
  chevron: <path d="m9 5 7 7-7 7" />,
  search: (
    <>
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m16 16 5 5" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  logout: (
    <>
      <path d="M10 4H4v16h6M9 12h12m-5-5 5 5-5 5" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 10a8 8 0 0 0-14-5L3 8m0-5v5h5M4 14a8 8 0 0 0 14 5l3-3m0 5v-5h-5" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" />
    </>
  ),
  star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />,
  upload: (
    <>
      <path d="M12 16V3m-5 5 5-5 5 5M4 15v6h16v-6" />
    </>
  ),
  file: (
    <>
      <path d="M14 3H5v18h14V8l-5-5Zm0 0v5h5M8 12h8m-8 4h5" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  trash: (
    <>
      <path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7" />
    </>
  ),
  external: (
    <>
      <path d="M14 3h7v7m0-7L10 14M10 3H3v18h18v-7" />
    </>
  ),
  send: (
    <>
      <path d="m3 3 18 9-18 9 4-9-4-9Zm4 9h14" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <ellipse cx="12" cy="12" rx="4" ry="9" />
      <path d="M3 12h18" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  eyeOff: (
    <>
      <path d="m3 3 18 18M9 5.5c6-2 11 5 13 6.5-.5 1-2 3-4 4.5M6 6c-2 1-4 4-4 6 4 6 9 9 15 6M10 10a3 3 0 0 0 4 4" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6m0-10v1" />
    </>
  ),
}
export default function Icon({
  name,
  size = 20,
  className = '',
  style,
}: {
  name: IconName
  size?: number
  className?: string
  style?: CSSProperties
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}
export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="brand">
      <span className="brand-mark">
        <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path
            d="m7 22 6-14 5 10 3-8 5 12M5 16h6m11 0h5"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {!compact && (
        <span>
          cryptomind<span className="brand-ai">ai</span>
        </span>
      )}
    </span>
  )
}
export function CoinMark({ symbol }: { symbol: string }) {
  return (
    <span className={`coin-mark coin-${symbol.toLowerCase()}`} aria-hidden="true">
      {symbol === 'BTC' ? '₿' : symbol === 'ETH' ? 'Ξ' : '≋'}
    </span>
  )
}
