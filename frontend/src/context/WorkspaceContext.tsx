import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router'
import { request } from '../api/client'
import { demoSnapshot, type MarketSnapshot } from '../data/demo'

import { WorkspaceContext } from './workspace'

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const isDemo = useLocation().pathname.startsWith('/explore')
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(isDemo ? demoSnapshot : null)
  const [selected, select] = useState('BTC')
  const [loading, setLoading] = useState(!isDemo)
  const [error, setError] = useState('')
  const controller = useRef<AbortController | null>(null)
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem('cryptomind_watchlist') || 'null')
      return Array.isArray(saved)
        ? saved.filter(
            (s): s is string => typeof s === 'string' && ['BTC', 'ETH', 'SOL'].includes(s),
          )
        : ['BTC', 'ETH', 'SOL']
    } catch {
      return ['BTC', 'ETH', 'SOL']
    }
  })
  const refresh = useCallback(async () => {
    if (isDemo) {
      setSnapshot(demoSnapshot)
      setLoading(false)
      setError('')
      return
    }
    controller.current?.abort()
    const abort = new AbortController()
    controller.current = abort
    setLoading(true)
    try {
      const data = await request<MarketSnapshot>('/api/v1/market/overview', {
        signal: abort.signal,
      })
      if (!abort.signal.aborted) {
        setSnapshot(data)
        setError('')
      }
    } catch (err) {
      if (!abort.signal.aborted)
        setError(err instanceof Error ? err.message : 'Market data is unavailable.')
    } finally {
      if (!abort.signal.aborted) setLoading(false)
    }
  }, [isDemo])
  useEffect(() => {
    const initial = window.setTimeout(() => {
      void refresh()
    }, 0)
    const interval = !isDemo
      ? window.setInterval(() => {
          void refresh()
        }, 60000)
      : undefined
    return () => {
      window.clearTimeout(initial)
      controller.current?.abort()
      window.clearInterval(interval)
    }
  }, [isDemo, refresh])
  const toggleWatch = (symbol: string) =>
    setWatchlist((current) => {
      const next = current.includes(symbol)
        ? current.filter((s) => s !== symbol)
        : [...current, symbol]
      try {
        localStorage.setItem('cryptomind_watchlist', JSON.stringify(next))
      } catch {
        /* In-memory watchlists still work. */
      }
      return next
    })
  return (
    <WorkspaceContext.Provider
      value={{
        isDemo,
        base: isDemo ? '/explore' : '/dashboard',
        snapshot,
        selected,
        select,
        loading,
        error,
        refresh: () => {
          void refresh()
        },
        watchlist,
        toggleWatch,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}
