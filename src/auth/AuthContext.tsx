import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { clearTokens, onSessionEnded, saveTokens, storedRefreshToken } from '../api/client'
import { shopApi } from '../api/shop'
import type { AuthResponse } from '../api/types'
import { AuthContext, type AuthState, type RegisterInput } from './useAuth'

/** Any account can shop here: shop owners, and admins checking the storefront. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [state, setState] = useState<AuthState>(() =>
    storedRefreshToken() ? { status: 'loading' } : { status: 'signed-out' },
  )

  // Restore the session after a reload: /api/me fails with 401, and the client refreshes.
  useEffect(() => {
    if (state.status !== 'loading') return
    shopApi
      .me()
      .then((user) => setState({ status: 'signed-in', user }))
      .catch(() => setState({ status: 'signed-out' }))
  }, [state.status])

  useEffect(() => onSessionEnded(() => setState({ status: 'signed-out' })), [])

  const signedIn = useCallback((response: AuthResponse) => {
    saveTokens(response)
    setState({ status: 'signed-in', user: response.user })
  }, [])

  const login = useCallback(
    async (identifier: string, password: string) => signedIn(await shopApi.login(identifier, password)),
    [signedIn],
  )

  const register = useCallback(async (input: RegisterInput) => signedIn(await shopApi.register(input)), [signedIn])

  const logout = useCallback(async () => {
    const refreshToken = storedRefreshToken()
    clearTokens()
    setState({ status: 'signed-out' })
    // Orders, addresses and quotes belong to the account that just left.
    queryClient.removeQueries({ predicate: (q) => !['settings', 'banners', 'categories', 'products', 'product'].includes(String(q.queryKey[0])) })
    if (refreshToken) await shopApi.logout(refreshToken).catch(() => {})
  }, [queryClient])

  const value = useMemo(() => ({ state, login, register, logout }), [state, login, register, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
