import { useId, useState } from 'react'
import { money } from '../data/demo'

export function Sparkline({ values, negative = false }: { values: number[]; negative?: boolean }) {
  if (values.length < 2) return <span className="muted">—</span>
  const min = Math.min(...values),
    range = Math.max(...values) - min || 1
  const points = values
    .map((v, i) => `${(i / (values.length - 1)) * 100},${27 - ((v - min) / range) * 23}`)
    .join(' ')
  return (
    <svg
      viewBox="0 0 100 32"
      className={`sparkline ${negative ? 'negative' : ''}`}
      aria-label="Seven day price trend"
      role="img"
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

export default function MarketChart({
  values,
  range,
  name,
  updatedAt,
  demo,
}: {
  values: number[]
  range: '24H' | '7D'
  name: string
  updatedAt: string
  demo: boolean
}) {
  const id = useId()
  const [hover, setHover] = useState<number | null>(null)
  const data = range === '24H' ? values.slice(-24) : values
  if (data.length < 2)
    return (
      <div className="chart-empty">
        <span>No chart history is available from the provider.</span>
      </div>
    )
  const width = 800,
    height = 260,
    left = 1,
    right = 70,
    top = 20,
    bottom = 28
  const minValue = Math.min(...data),
    maxValue = Math.max(...data),
    padding = (maxValue - minValue) * 0.18 || minValue * 0.01
  const min = minValue - padding,
    max = maxValue + padding
  const x = (i: number) => left + (i / (data.length - 1)) * (width - left - right)
  const y = (v: number) => top + (1 - (v - min) / (max - min)) * (height - top - bottom)
  const points = data.map((v, i) => `${x(i)},${y(v)}`).join(' ')
  const area = `M${left},${height - bottom} L${data.map((v, i) => `${x(i)},${y(v)}`).join(' L')} L${x(data.length - 1)},${height - bottom} Z`
  const index = hover === null ? null : Math.min(hover, data.length - 1)
  const end = demo ? null : new Date(updatedAt).getTime()
  const label = (fraction: number) => {
    if (demo)
      return range === '24H'
        ? ['00:00', '06:00', '12:00', '18:00', '24:00'][Math.round(fraction * 4)]
        : ['MON', 'TUE', 'THU', 'SAT', 'SUN'][Math.round(fraction * 4)]
    const date = new Date((end || 0) - (1 - fraction) * (range === '24H' ? 23 : 167) * 3600000)
    return new Intl.DateTimeFormat(
      'en-US',
      range === '24H'
        ? { hour: '2-digit', minute: '2-digit', timeZone: 'UTC', hour12: false }
        : { month: 'short', day: 'numeric', timeZone: 'UTC' },
    ).format(date)
  }
  return (
    <div className="market-chart">
      {index !== null && (
        <div
          className="chart-tooltip"
          style={{ left: `${Math.min(80, Math.max(4, (x(index) / width) * 100))}%` }}
        >
          <span>{demo ? 'Sample price' : 'Historical price'}</span>
          <strong>{money(data[index])}</strong>
        </div>
      )}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${name} ${range === '24H' ? '24 hour' : '7 day'} price chart`}
        onPointerLeave={() => setHover(null)}
        onPointerMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect()
          const pointer = ((event.clientX - rect.left) / rect.width) * width
          setHover(
            Math.round(
              Math.min(1, Math.max(0, (pointer - left) / (width - left - right))) *
                (data.length - 1),
            ),
          )
        }}
      >
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a0e8c3" stopOpacity=".15" />
            <stop offset="100%" stopColor="#a0e8c3" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((i) => {
          const value = min + ((max - min) * i) / 3
          return (
            <g key={i}>
              <line
                x1={left}
                y1={y(value)}
                x2={width - right}
                y2={y(value)}
                stroke="#293034"
                strokeDasharray="3 5"
              />
              <text x={width - right + 14} y={y(value) + 4} className="chart-axis">
                {new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)}
              </text>
            </g>
          )
        })}
        <path d={area} fill={`url(#${id})`} />
        <polyline
          points={points}
          stroke="#a0e8c3"
          strokeWidth="2"
          strokeLinejoin="round"
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
        <circle cx={x(data.length - 1)} cy={y(data.at(-1)!)} r="4" fill="#a0e8c3" />
        <circle
          cx={x(data.length - 1)}
          cy={y(data.at(-1)!)}
          r="8"
          fill="#a0e8c3"
          fillOpacity=".1"
        />
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <text
            key={f}
            x={left + f * (width - left - right)}
            y={height - 3}
            textAnchor={f === 0 ? 'start' : f === 1 ? 'end' : 'middle'}
            className="chart-axis"
          >
            {label(f)}
          </text>
        ))}
        {index !== null && (
          <g>
            <line
              x1={x(index)}
              x2={x(index)}
              y1={top}
              y2={height - bottom}
              stroke="#899b91"
              strokeDasharray="3 4"
            />
            <circle
              cx={x(index)}
              cy={y(data[index])}
              r="5"
              fill="#a0e8c3"
              stroke="#171d1f"
              strokeWidth="2"
            />
          </g>
        )}
      </svg>
    </div>
  )
}
