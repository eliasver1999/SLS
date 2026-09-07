import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  fetchMe,
  login as loginApi,
  logoutApi,
  register as registerApi,
  setAuthToken,
  type AuthUser,
} from '../lib/api'

/**
 * Real token auth (Laravel Sanctum). Roles + approval come from the server:
 *  - guest    → not signed in; specs open, pricing hidden
 *  - pending  → signed in but awaiting admin approval; still specs-only, no cart
 *  - approved → approved partner; pricing + cart + ordering unlocked
 *  - admin    → member approvals + product management (always approved)
 *
 * body[data-auth] is kept in sync ('guest' | 'pending' | 'approved') so the
 * CSS pricing gating (.guest-only / .approved-only / .pending-only) works.
 */
type AuthValue = {
  user: AuthUser | null
  loading: boolean
  isAuthenticated: boolean
  isApproved: boolean
  isAdmin: boolean
  login: (email: string, password: string) => Promise<AuthUser>
  register: (p: { name: string; email: string; password: string; company?: string }) => Promise<AuthUser>
  logout: () => Promise<void>
  /** Replace the cached user after a profile save. */
  setUser: (u: AuthUser) => void
}

const AuthContext = createContext<AuthValue | null>(null)

const TOKEN_KEY = 'sls.token'
const USER_KEY = 'sls.user'

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser())
  const [loading, setLoading] = useState(true)

  // Restore token on the axios instance immediately, then verify via /me.
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      setLoading(false)
      return
    }
    setAuthToken(token)
    fetchMe()
      .then((u) => {
        setUser(u)
        localStorage.setItem(USER_KEY, JSON.stringify(u))
      })
      .catch(() => {
        // token invalid/expired → sign out locally
        setAuthToken(null)
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  // Mirror approval state to body[data-auth] for the CSS pricing gate.
  // Pending members are treated like guests for pricing (specs only).
  useEffect(() => {
    document.body.dataset.auth = !user ? 'guest' : user.approved ? 'approved' : 'pending'
  }, [user])

  const persist = useCallback((token: string, u: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(u))
    setAuthToken(token)
    setUser(u)
  }, [])

  // A profile save returns the updated user; keep the cached copy in step so
  // the header and dashboard do not show stale details until the next reload.
  const updateCachedUser = useCallback((u: AuthUser) => {
    localStorage.setItem(USER_KEY, JSON.stringify(u))
    setUser(u)
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      const { token, user: u } = await loginApi(email, password)
      persist(token, u)
      return u
    },
    [persist],
  )

  const register = useCallback(
    async (p: { name: string; email: string; password: string; company?: string }) => {
      const { token, user: u } = await registerApi(p)
      persist(token, u)
      return u
    },
    [persist],
  )

  const logout = useCallback(async () => {
    try {
      await logoutApi()
    } catch {
      // ignore network/expired-token errors on logout
    }
    setAuthToken(null)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }, [])

  const value = useMemo<AuthValue>(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      isApproved: !!user?.approved,
      isAdmin: user?.role === 'admin',
      login,
      register,
      logout,
      setUser: updateCachedUser,
    }),
    [user, loading, login, register, logout, updateCachedUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
