import {createContext,useEffect,useState,type ReactNode,} from 'react'

import { getCurrentUser } from '../api/auth'
import type { User } from '../types/auth'
import { removeAccessToken } from '../utils/token'


interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  setUser: (user: User | null) => void
  logout: () => void
}


export const AuthContext = createContext<
  AuthContextType | undefined
>(undefined)


interface AuthProviderProps {
  children: ReactNode
}


export function AuthProvider({
  children,
}: AuthProviderProps) {

  const [user, setUser] = useState<User | null>(null)

  const [loading, setLoading] = useState(true)


  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const currentUser = await getCurrentUser()

        setUser(currentUser)

      } catch {
        setUser(null)

      } finally {
        setLoading(false)
      }
    }

    loadCurrentUser()
  }, [])


  const logout = () => {
    removeAccessToken()
    setUser(null)
  }


  const isAuthenticated = user !== null


  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        setUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}