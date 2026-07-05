import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  Clock,
  Fingerprint,
  KeyRound,
  LogOut,
  Mail,
  Moon,
  Ruler,
  ShieldCheck,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuth } from '../state/AuthContext'
import { useAppState } from '../state/AppStateContext'
import { formatDateTime } from '../lib/format'
import { GlassCard } from '../components/ui/GlassCard'
import { PageTransition } from '../components/layout/PageTransition'

interface InfoRowProps {
  icon: LucideIcon
  label: string
  value: string
}

function InfoRow({ icon: Icon, label, value }: InfoRowProps) {
  return (
    <div className="flex w-full items-center gap-3.5 px-4 py-3.5">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.06]">
        <Icon className="size-[18px] text-fog" strokeWidth={1.8} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-0.5 truncate text-xs text-fog">{value}</p>
      </div>
    </div>
  )
}

interface PreferenceRowProps {
  icon: LucideIcon
  label: string
  value: string
}

function PreferenceRow({ icon: Icon, label, value }: PreferenceRowProps) {
  return (
    <div className="flex w-full items-center gap-3.5 px-4 py-3.5">
      <div className="flex size-10 items-center justify-center rounded-xl bg-white/[0.06]">
        <Icon className="size-[18px] text-fog" strokeWidth={1.8} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-0.5 text-xs text-fog">{value}</p>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, signOut, resetPassword } = useAuth()
  const { profile, showToast } = useAppState()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [isSendingReset, setIsSendingReset] = useState(false)

  const displayName =
    profile?.displayName ?? user?.email?.split('@')[0] ?? 'Sua conta'
  const lastSignIn = user?.last_sign_in_at
    ? formatDateTime(user.last_sign_in_at)
    : 'Nesta sessão'

  async function handleChangePassword() {
    if (isSendingReset || !user?.email) return
    setIsSendingReset(true)
    const result = await resetPassword(user.email)
    setIsSendingReset(false)
    showToast(
      result.ok
        ? `Link de redefinição enviado para ${user.email}`
        : result.message,
    )
  }

  async function handleSignOut() {
    if (isSigningOut) return
    setIsSigningOut(true)
    try {
      await signOut()
      navigate('/', { replace: true })
    } catch {
      setIsSigningOut(false)
      showToast('Não foi possível encerrar a sessão. Tente novamente.')
    }
  }

  return (
    <PageTransition>
      <header className="mt-6">
        <h1 className="font-display text-2xl font-bold tracking-tight">Perfil</h1>
      </header>

      {/* Identidade */}
      <GlassCard className="mt-5 flex items-center gap-4 p-5" delay={0.05}>
        <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-lime/25 to-cyan/20 font-display text-xl font-bold text-lime">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-bold">{displayName}</p>
          <p className="truncate text-sm text-fog">{user?.email ?? '—'}</p>
        </div>
      </GlassCard>

      {/* Conta */}
      <section className="mt-6">
        <h2 className="px-1 text-xs font-semibold tracking-widest text-faint uppercase">
          Conta
        </h2>
        <GlassCard className="mt-2.5 divide-y divide-line/60" delay={0.1}>
          <InfoRow icon={Mail} label="E-mail" value={user?.email ?? '—'} />
          <InfoRow icon={Fingerprint} label="ID do usuário" value={user?.id ?? '—'} />
          <InfoRow
            icon={ShieldCheck}
            label="Status"
            value={user ? 'Autenticado via Supabase' : 'Sem sessão'}
          />
          <InfoRow icon={Clock} label="Último login" value={lastSignIn} />
        </GlassCard>
        <GlassCard className="mt-2.5" delay={0.12}>
          <button
            type="button"
            onClick={handleChangePassword}
            disabled={isSendingReset}
            className="flex w-full items-center gap-3.5 rounded-3xl p-4 text-left transition-colors duration-200 hover:bg-white/[0.04] disabled:opacity-50"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.06]">
              <KeyRound className="size-[18px] text-fog" strokeWidth={1.8} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">
                {isSendingReset ? 'Enviando…' : 'Alterar senha'}
              </p>
              <p className="mt-0.5 text-xs text-fog">
                Enviaremos um link de redefinição para seu e-mail
              </p>
            </div>
          </button>
        </GlassCard>
      </section>

      {/* Preferências */}
      <section className="mt-6">
        <h2 className="px-1 text-xs font-semibold tracking-widest text-faint uppercase">
          Preferências
        </h2>
        <GlassCard className="mt-2.5 divide-y divide-line/60" delay={0.15}>
          <PreferenceRow icon={Bell} label="Notificações" value="Lembretes de refeição e água" />
          <PreferenceRow icon={Ruler} label="Unidades" value="Métrico (kg, ml, kcal)" />
          <PreferenceRow icon={Moon} label="Aparência" value="Escuro (padrão)" />
        </GlassCard>
      </section>

      {/* Sair */}
      <GlassCard className="mt-6" delay={0.2}>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="flex w-full items-center justify-center gap-2 rounded-3xl p-4 text-sm font-medium text-amber transition-colors duration-200 hover:bg-amber/[0.06] disabled:opacity-50"
        >
          <LogOut className="size-4" />
          {isSigningOut ? 'Encerrando sessão…' : 'Sair da conta'}
        </button>
      </GlassCard>

      <p className="mt-8 text-center text-xs text-faint">
        CalorieFlow v0.2 — Sprint 2
      </p>
    </PageTransition>
  )
}
