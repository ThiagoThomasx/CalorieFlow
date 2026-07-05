import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Flame, Info, MailCheck } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { isSupabaseConfigured } from '../lib/supabase'
import { useAuth } from '../state/AuthContext'

type AuthMode = 'login' | 'signup' | 'forgot'

const MIN_PASSWORD_LENGTH = 6

const INPUT_CLASSES =
  'h-13 w-full rounded-2xl border border-line bg-white/[0.04] px-4 text-[15px] text-snow placeholder:text-faint transition-colors duration-200 outline-none focus:border-lime/60 focus:bg-white/[0.06]'

export default function AuthPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { signIn, signUp, resetPassword } = useAuth()

  const initialMode: AuthMode =
    searchParams.get('mode') === 'signup' ? 'signup' : 'login'
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null)
  const [recoverySentTo, setRecoverySentTo] = useState<string | null>(null)

  const isLogin = mode === 'login'
  const isForgot = mode === 'forgot'

  async function handleForgotSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (!email.includes('@')) {
      setError('Informe um e-mail válido.')
      return
    }

    setIsSubmitting(true)
    const result = await resetPassword(email)
    setIsSubmitting(false)
    if (!result.ok) {
      setError(result.message)
      return
    }
    setRecoverySentTo(email)
  }

  function handleBackFromForgot() {
    setRecoverySentTo(null)
    setMode('login')
    setError(null)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (!email.includes('@')) {
      setError('Informe um e-mail válido.')
      return
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`)
      return
    }

    setIsSubmitting(true)
    if (isLogin) {
      const result = await signIn(email, password)
      setIsSubmitting(false)
      if (!result.ok) {
        setError(result.message)
        return
      }
      navigate('/app', { replace: true })
      return
    }

    const result = await signUp(email, password)
    setIsSubmitting(false)
    if (!result.ok) {
      setError(result.message)
      return
    }
    if (result.needsEmailConfirmation) {
      setConfirmationEmail(email)
      return
    }
    navigate('/app', { replace: true })
  }

  function handleBackToLogin() {
    setConfirmationEmail(null)
    setMode('login')
    setPassword('')
    setError(null)
  }

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-hidden px-6 pt-safe pb-safe">
      <div aria-hidden className="orb -top-24 -right-24 size-72 bg-lime/12" />
      <div aria-hidden className="orb bottom-1/4 -left-24 size-64 bg-cyan/10" />

      <div className="mt-6 flex items-center justify-between">
        <Link
          to="/"
          aria-label="Voltar"
          className="glass flex size-10 items-center justify-center rounded-xl text-fog transition-colors hover:text-snow"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-lime">
            <Flame className="size-4 text-ink" strokeWidth={2.4} />
          </div>
          <span className="font-display text-sm font-bold">CalorieFlow</span>
        </div>
        <div className="size-10" aria-hidden />
      </div>

      {confirmationEmail ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mt-16 flex flex-col items-center text-center"
        >
          <div className="glass-strong flex size-16 items-center justify-center rounded-3xl">
            <MailCheck className="size-8 text-lime" strokeWidth={1.8} />
          </div>
          <h1 className="mt-6 font-display text-3xl font-bold tracking-tight">
            Confirme seu e-mail
          </h1>
          <p className="mt-3 max-w-72 text-[15px] leading-relaxed text-fog">
            Enviamos um link de confirmação para{' '}
            <strong className="text-snow">{confirmationEmail}</strong>. Abra sua
            caixa de entrada para ativar a conta e depois entre.
          </p>
          <Button fullWidth className="mt-8" onClick={handleBackToLogin}>
            Ir para o login
          </Button>
        </motion.div>
      ) : recoverySentTo ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mt-16 flex flex-col items-center text-center"
        >
          <div className="glass-strong flex size-16 items-center justify-center rounded-3xl">
            <MailCheck className="size-8 text-lime" strokeWidth={1.8} />
          </div>
          <h1 className="mt-6 font-display text-3xl font-bold tracking-tight">
            Verifique seu e-mail
          </h1>
          <p className="mt-3 max-w-72 text-[15px] leading-relaxed text-fog">
            Se houver uma conta para{' '}
            <strong className="text-snow">{recoverySentTo}</strong>, enviamos um
            link para redefinir sua senha. Abra sua caixa de entrada.
          </p>
          <Button fullWidth className="mt-8" onClick={handleBackFromForgot}>
            Ir para o login
          </Button>
        </motion.div>
      ) : isForgot ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10"
        >
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Recuperar senha
          </h1>
          <p className="mt-2 text-[15px] text-fog">
            Informe seu e-mail e enviaremos um link para redefinir sua senha.
          </p>

          <form onSubmit={handleForgotSubmit} className="mt-6 flex flex-col gap-3.5">
            <input
              type="email"
              autoComplete="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={INPUT_CLASSES}
            />

            {error && (
              <p role="alert" className="px-1 text-sm text-amber">
                {error}
              </p>
            )}

            <Button type="submit" fullWidth isLoading={isSubmitting} className="mt-1">
              Enviar link de recuperação
            </Button>
            <Button type="button" variant="ghost" fullWidth onClick={handleBackFromForgot}>
              Voltar para o login
            </Button>
          </form>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10"
        >
          <h1 className="font-display text-3xl font-bold tracking-tight">
            {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
          </h1>
          <p className="mt-2 text-[15px] text-fog">
            {isLogin
              ? 'Continue de onde parou.'
              : 'Leva menos de um minuto para começar.'}
          </p>

          {/* Alternador login/registro */}
          <div className="glass mt-8 flex rounded-2xl p-1">
            {(['login', 'signup'] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setMode(option)
                  setError(null)
                }}
                className={`relative flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors duration-200 ${
                  mode === option ? 'text-ink' : 'text-fog hover:text-snow'
                }`}
              >
                {mode === option && (
                  <motion.span
                    layoutId="auth-tab"
                    className="absolute inset-0 rounded-xl bg-lime"
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  />
                )}
                <span className="relative">
                  {option === 'login' ? 'Entrar' : 'Registrar'}
                </span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3.5">
            <input
              type="email"
              autoComplete="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={INPUT_CLASSES}
            />
            <input
              type="password"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              placeholder="Senha"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={INPUT_CLASSES}
            />

            {isLogin && (
              <button
                type="button"
                onClick={() => {
                  setMode('forgot')
                  setError(null)
                }}
                className="self-end text-xs font-medium text-fog transition-colors hover:text-lime"
              >
                Esqueci minha senha
              </button>
            )}

            {error && (
              <p role="alert" className="px-1 text-sm text-amber">
                {error}
              </p>
            )}

            <Button type="submit" fullWidth isLoading={isSubmitting} className="mt-1">
              {isLogin ? 'Entrar' : 'Criar conta'}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-faint">
            <span className="h-px flex-1 bg-line" />
            ou
            <span className="h-px flex-1 bg-line" />
          </div>

          <Button
            fullWidth
            variant="outline"
            onClick={() => setError('Login com Google chega na próxima sprint.')}
          >
            <GoogleIcon />
            Continuar com Google
          </Button>

          {!isSupabaseConfigured() && (
            <div className="glass mt-6 flex items-start gap-2.5 rounded-2xl p-3.5 text-xs leading-relaxed text-fog">
              <Info className="mt-0.5 size-4 shrink-0 text-amber" />
              <span>
                <strong className="text-snow">Supabase não configurado.</strong>{' '}
                Crie o arquivo <code>.env.local</code> com as credenciais do
                projeto (veja o README) para ativar login e persistência.
              </span>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  )
}
