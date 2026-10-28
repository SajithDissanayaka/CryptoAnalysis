import { createContext } from 'react'
import type { MarketSnapshot } from '../data/demo'

export interface Workspace {
  isDemo: boolean
  base: string
  snapshot: MarketSnapshot | null
  loading: boolean
  error: string
  selected: string
  select: (symbol: string) => void
  refresh: () => void
  watchlist: string[]
  toggleWatch: (symbol: string) => void
}
export const WorkspaceContext = createContext<Workspace | null>(null)
