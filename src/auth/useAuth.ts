import { createContext, useContext } from 'react'
import type { UserSummary } from '../api/types'

export type AuthState =
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'signed-in'; user: UserSummary }

export interface RegisterInput {
  fullName: string
  email: string | null
  phone: string | null
  password: string
}

export interface AuthContextValue {
  state: AuthState
  login: (identifier: string, password: string) => Promise<void>
  register: (input: RegisterInput) => Promise<void>
  /** Reloads the signed-in user, e.g. after the shop profile is completed. */
  refreshUser: () => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}
