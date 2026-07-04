import { useNavigate } from 'react-router-dom'
import {
  Bell,
  ChevronRight,
  Database,
  LogOut,
  Moon,
  Ruler,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { MOCK_USER } from '../lib/mockData'
import { isSupabaseConfigured, signOut } from '../lib/supabase'
import { useAppState } from '../state/AppStateContext'
import { GlassCard } from '../components/ui/GlassCard'
import { PageTransition } from '../components/layout/PageTransition'

interface PreferenceRowProps {
  icon: LucideIcon
  label: string
  value: string
}

function PreferenceRow({ icon: Icon, label, value }: PreferenceRowProps) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors duration-200 hover:bg-white/[0.04] first:rounded-t-3xl last:rounded-b-3xl"
    >
      <div className="flex size-10 items-center justify-center rounded-xl bg-white/[0.06]">
        <Icon className="size-[18px] text-fog" strokeWidth={1.8} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-0.5 text-xs text-fog">{value}</p>
      </div>
      <ChevronRight className="size-4 text-faint" />
    </button>
  )
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const { showToast } = useAppState()
  const supabaseReady = isSupabaseConfigured()

  async function handleSignOut() {
    await signOut()
    showToast('Sessão encerrada')
    navigate('/')
  }

  return (
    <PageTransition>
      <header className="mt-6">
        <h1 className="font-display text-2xl font-bold tracking-tight">Perfil</h1>
      </header>

      {/* Identidade */}
      <GlassCard className="mt-5 flex items-center gap-4 p-5" delay={0.05}>
        <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-lime/25 to-cyan/20 font-display text-xl font-bold text-lime">
          {MOCK_USER.name.charAt(0)}
        </div>
        <div>
          <p className="font-display text-lg font-bold">{MOCK_USER.name}</p>
          <p className="text-sm text-fog">{MOCK_USER.email}</p>
        </div>
      </GlassCard>

      {/* Status Supabase */}
      <GlassCard className="mt-4 flex items-center gap-3.5 p-4" delay={0.1}>
        <div
          className={`flex size-10 items-center justify-center rounded-xl ${
            supabaseReady ? 'bg-lime/15 text-lime' : 'bg-amber/10 text-amber'
          }`}
        >
          <Database className="size-[18px]" strokeWidth={1.8} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">Supabase</p>
          <p className="mt-0.5 text-xs text-fog">
            {supabaseReady
              ? 'Conectado e pronto para sincronizar.'
              : 'Não configurado — usando dados locais.'}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase ${
            supabaseReady ? 'bg-lime/15 text-lime' : 'bg-amber/10 text-amber'
          }`}
        >
          {supabaseReady ? 'ativo' : 'pendente'}
        </span>
      </GlassCard>

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
          className="flex w-full items-center justify-center gap-2 rounded-3xl p-4 text-sm font-medium text-amber transition-colors duration-200 hover:bg-amber/[0.06]"
        >
          <LogOut className="size-4" />
          Sair da conta
        </button>
      </GlassCard>

      <p className="mt-8 text-center text-xs text-faint">
        CalorieFlow v0.1 — Sprint 1
      </p>
    </PageTransition>
  )
}
