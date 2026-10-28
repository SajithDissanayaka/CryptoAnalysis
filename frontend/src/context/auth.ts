import { createContext } from 'react'
import type { User } from '../types/auth'

export interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  setUser: (user: User | null) => void
  logout: () => void
}
export const AuthContext = createContext<AuthContextType | undefined>(undefined)
