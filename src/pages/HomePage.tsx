import { Link } from 'react-router-dom'
import { Activity, Droplets, Flame, Plus, UtensilsCrossed } from 'lucide-react'
import { useAppState } from '../state/AppStateContext'
import { useAuth } from '../state/AuthContext'
import { CUP_SIZE_ML } from '../lib/constants'
import { dayKey, formatFullDate, formatMl, greetingForHour } from '../lib/format'
import { sumMeals } from '../lib/nutrition'
import { GlassCard } from '../components/ui/GlassCard'
import { ProgressRing } from '../components/ui/ProgressRing'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Skeleton } from '../components/ui/Skeleton'
import { MacroBar } from '../components/nutrition/MacroBar'
import { MealCard } from '../components/nutrition/MealCard'
import { PageTransition } from '../components/layout/PageTransition'

export default function HomePage() {
  const { user } = useAuth()
  const {
    status,
    meals,
    goals,
    waterMl,
    activity,
    profile,
    addWater,
    retry,
    showToast,
  } = useAppState()

  const now = new Date()
  const today = dayKey(now.toISOString())
  const todayMeals = meals.filter((meal) => dayKey(meal.createdAt) === today)
  const consumed = sumMeals(todayMeals)
  const remaining = Math.max(goals.caloriesGoal - consumed.calories, 0)

  const displayName =
    profile?.displayName ?? user?.email?.split('@')[0] ?? 'você'
  const avatarLetter = displayName.charAt(0).toUpperCase()

  function handleAddWater() {
    addWater(CUP_SIZE_ML)
    showToast(`+${CUP_SIZE_ML} ml de água registrados`)
  }

  if (status === 'loading') {
    return (
      <PageTransition>
        <HomeSkeleton />
      </PageTransition>
    )
  }

  if (status === 'error') {
    return (
      <PageTransition>
        <header className="mt-6">
          <p className="text-sm text-fog capitalize">{formatFullDate(now)}</p>
          <h1 className="mt-0.5 font-display text-2xl font-bold tracking-tight">
            {greetingForHour(now.getHours())}
          </h1>
        </header>
        <ErrorState onRetry={retry} />
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      {/* Cabeçalho */}
      <header className="mt-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-fog capitalize">{formatFullDate(now)}</p>
          <h1 className="mt-0.5 font-display text-2xl font-bold tracking-tight">
            {greetingForHour(now.getHours())}, {displayName}
          </h1>
        </div>
        <Link
          to="/app/profile"
          aria-label="Abrir perfil"
          className="glass flex size-11 items-center justify-center rounded-2xl font-display text-sm font-bold text-lime"
        >
          {avatarLetter}
        </Link>
      </header>

      {/* Anel de calorias */}
      <GlassCard className="mt-6 flex flex-col items-center px-6 py-7" delay={0.05}>
        <ProgressRing progress={consumed.calories / goals.caloriesGoal} size={196}>
          <div className="text-center">
            <p className="font-display text-[2.5rem] leading-none font-bold">
              {consumed.calories.toLocaleString('pt-BR')}
            </p>
            <p className="mt-1.5 text-xs tracking-wide text-fog">
              de {goals.caloriesGoal.toLocaleString('pt-BR')} kcal
            </p>
            <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-lime/10 px-2.5 py-1 text-[11px] font-medium text-lime">
              <Flame className="size-3" />
              restam {remaining.toLocaleString('pt-BR')}
            </p>
          </div>
        </ProgressRing>

        <div className="mt-6 flex w-full gap-5">
          <MacroBar
            label="Proteína"
            consumed={consumed.protein}
            goal={goals.proteinGoal}
            color="var(--color-lime)"
            delay={0.2}
          />
          <MacroBar
            label="Carboidratos"
            consumed={consumed.carbs}
            goal={goals.carbsGoal}
            color="var(--color-cyan)"
            delay={0.3}
          />
          <MacroBar
            label="Gorduras"
            consumed={consumed.fat}
            goal={goals.fatGoal}
            color="var(--color-violet)"
            delay={0.4}
          />
        </div>
      </GlassCard>

      {/* Água + atividade */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <GlassCard className="p-4" delay={0.12}>
          <div className="flex items-center justify-between">
            <Droplets className="size-5 text-cyan" strokeWidth={1.8} />
            <button
              type="button"
              onClick={handleAddWater}
              aria-label={`Adicionar ${CUP_SIZE_ML} ml de água`}
              className="flex size-8 items-center justify-center rounded-xl bg-cyan/15 text-cyan transition-colors duration-200 hover:bg-cyan/25"
            >
              <Plus className="size-4" strokeWidth={2.4} />
            </button>
          </div>
          <p className="mt-3 font-display text-xl font-bold">{formatMl(waterMl)}</p>
          <p className="mt-0.5 text-xs text-fog">
            meta {formatMl(goals.waterGoalMl)}
          </p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
            <div
              className="h-full rounded-full bg-cyan transition-[width] duration-700"
              style={{
                width: `${Math.min((waterMl / goals.waterGoalMl) * 100, 100)}%`,
              }}
            />
          </div>
        </GlassCard>

        <GlassCard className="p-4" delay={0.18}>
          <Activity className="size-5 text-amber" strokeWidth={1.8} />
          <p className="mt-3 font-display text-xl font-bold">
            {activity?.minutes ?? 0} min
          </p>
          <p className="mt-0.5 text-xs text-fog">
            {activity?.type ?? 'Sem atividade hoje'}
          </p>
          <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-amber/10 px-2 py-0.5 text-[11px] font-medium text-amber">
            <Flame className="size-3" />
            {activity?.caloriesBurned ?? 0} kcal
          </p>
        </GlassCard>
      </div>

      {/* Refeições de hoje */}
      <section className="mt-7">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold tracking-tight">
            Refeições de hoje
          </h2>
          <Link
            to="/app/log"
            className="inline-flex items-center gap-1 text-sm font-medium text-lime transition-opacity hover:opacity-80"
          >
            <Plus className="size-4" />
            Registrar
          </Link>
        </div>

        {todayMeals.length === 0 ? (
          <EmptyState
            icon={UtensilsCrossed}
            title="Nenhuma refeição ainda"
            description="Registre sua primeira refeição do dia em menos de 20 segundos."
          />
        ) : (
          <div className="mt-3 flex flex-col gap-2.5">
            {todayMeals.map((meal) => (
              <MealCard key={meal.id} meal={meal} />
            ))}
          </div>
        )}
      </section>
    </PageTransition>
  )
}

function HomeSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando seus dados">
      <header className="mt-6 flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-7 w-52" />
        </div>
        <Skeleton className="size-11" />
      </header>
      <Skeleton className="mt-6 h-80 w-full rounded-3xl" />
      <div className="mt-4 grid grid-cols-2 gap-4">
        <Skeleton className="h-36 rounded-3xl" />
        <Skeleton className="h-36 rounded-3xl" />
      </div>
      <Skeleton className="mt-7 h-6 w-44" />
      <div className="mt-3 flex flex-col gap-2.5">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  )
}
