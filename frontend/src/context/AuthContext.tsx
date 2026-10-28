import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { getCurrentUser } from '../api/auth'
import { ApiError } from '../api/client'
import type { User } from '../types/auth'
import { getAccessToken, removeAccessToken } from '../utils/token'

import { AuthContext } from './auth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(!!getAccessToken())
  const logout = useCallback(() => {
    removeAccessToken()
    setUser(null)
  }, [])
  useEffect(() => {
    const controller = new AbortController()
    const restoringToken = getAccessToken()
    if (restoringToken) {
      getCurrentUser(controller.signal)
        .then((next) => {
          if (!controller.signal.aborted && getAccessToken() === restoringToken) setUser(next)
        })
        .catch((error) => {
          if (error instanceof ApiError && (error.status === 401 || error.status === 403))
            removeAccessToken()
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false)
        })
    }
    const syncSession = (event: StorageEvent) => {
      if (event.key === 'cryptomind_access_token') {
        setUser(null)
        if (event.newValue) window.location.reload()
      }
    }
    window.addEventListener('auth:expired', logout)
    window.addEventListener('storage', syncSession)
    return () => {
      controller.abort()
      window.removeEventListener('auth:expired', logout)
      window.removeEventListener('storage', syncSession)
    }
  }, [logout])
  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: user !== null, loading, setUser, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}
