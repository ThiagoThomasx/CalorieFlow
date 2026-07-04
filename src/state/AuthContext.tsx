import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import {
  SUPABASE_NOT_CONFIGURED_MESSAGE,
  supabase,
  translateAuthError,
} from '../lib/supabase'

export type SignInResult = { ok: true } | { ok: false; message: string }

export type SignUpResult =
  | { ok: true; needsEmailConfirmation: boolean }
  | { ok: false; message: string }

interface AuthContextValue {
  user: User | null
  session: Session | null
  /** true enquanto a sessão persistida ainda está sendo restaurada. */
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<SignInResult>
  signUp: (email: string, password: string) => Promise<SignUpResult>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false)
      return
    }

    let isMounted = true

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!isMounted) return
        setSession(data.session)
        setIsLoading(false)
      })
      .catch(() => {
        if (!isMounted) return
        setIsLoading(false)
      })

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (isMounted) setSession(nextSession)
      },
    )

    return () => {
      isMounted = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(
    async (email: string, password: string): Promise<SignInResult> => {
      if (!supabase) return { ok: false, message: SUPABASE_NOT_CONFIGURED_MESSAGE }

      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return { ok: false, message: translateAuthError(error.message) }
      return { ok: true }
    },
    [],
  )

  const signUp = useCallback(
    async (email: string, password: string): Promise<SignUpResult> => {
      if (!supabase) return { ok: false, message: SUPABASE_NOT_CONFIGURED_MESSAGE }

      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) return { ok: false, message: translateAuthError(error.message) }

      // Sem sessão após o cadastro = projeto exige confirmação de e-mail.
      return { ok: true, needsEmailConfirmation: !data.session }
    },
    [],
  )

  const signOut = useCallback(async () => {
    if (!supabase) return
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error(translateAuthError(error.message))
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      isLoading,
      signIn,
      signUp,
      signOut,
    }),
    [session, isLoading, signIn, signUp, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  }
  return context
}
