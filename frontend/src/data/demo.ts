export interface Asset {
  symbol: string
  name: string
  price: number
  change: number | null
  market_cap: number | null
  volume: number | null
  high: number | null
  low: number | null
  sparkline: number[]
  updated_at: string
}
export interface MarketSnapshot {
  assets: Asset[]
  source: string
  quote_currency: string
  updated_at: string
}

function history(price: number, index: number) {
  return Array.from({ length: 168 }, (_, i) => {
    const trend = 0.93 + (0.07 * i) / 167
    const wave =
      (Math.sin(i * 0.15 + index) * 0.009 + Math.sin(i * 0.63) * 0.003) *
      Math.sin((Math.PI * i) / 167)
    return Math.round(price * (trend + wave) * 100) / 100
  })
}
export const demoSnapshot: MarketSnapshot = {
  source: 'Illustrative demo dataset',
  quote_currency: 'USD',
  updated_at: '',
  assets: [
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      price: 67428.8,
      change: 2.84,
      market_cap: 1327000000000,
      volume: 28430000000,
      high: 68102.34,
      low: 65120.0,
      sparkline: history(67428.8, 0),
      updated_at: '',
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      price: 3521.64,
      change: 1.62,
      market_cap: 423210000000,
      volume: 14200000000,
      high: 3589.1,
      low: 3412.4,
      sparkline: history(3521.64, 2),
      updated_at: '',
    },
    {
      symbol: 'SOL',
      name: 'Solana',
      price: 174.36,
      change: -0.81,
      market_cap: 78490000000,
      volume: 3120000000,
      high: 179.2,
      low: 171.5,
      sparkline: history(174.36, 5),
      updated_at: '',
    },
  ],
}
export const money = (value: number | null | undefined, digits = 2) =>
  value == null
    ? '—'
    : new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      }).format(value)
export const compactMoney = (value: number | null) =>
  value == null
    ? '—'
    : new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        notation: 'compact',
        maximumFractionDigits: 2,
      }).format(value)
export const percent = (value: number | null) =>
  value == null ? '—' : `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
