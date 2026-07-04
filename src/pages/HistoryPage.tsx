import { useNavigate } from 'react-router-dom'
import { CalendarDays, Flame } from 'lucide-react'
import type { MealLog } from '../types/nutrition'
import { useAppState } from '../state/AppStateContext'
import { dayKey, dayLabel } from '../lib/format'
import { sumMeals } from '../lib/nutrition'
import { MealCard } from '../components/nutrition/MealCard'
import { EmptyState } from '../components/ui/EmptyState'
import { Button } from '../components/ui/Button'
import { PageTransition } from '../components/layout/PageTransition'

interface DayGroup {
  key: string
  meals: MealLog[]
}

/** Agrupa refeições por dia, preservando a ordem (mais recente primeiro). */
function groupMealsByDay(meals: MealLog[]): DayGroup[] {
  const sorted = [...meals].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
  const groups = new Map<string, MealLog[]>()
  for (const meal of sorted) {
    const key = dayKey(meal.createdAt)
    groups.set(key, [...(groups.get(key) ?? []), meal])
  }
  return Array.from(groups, ([key, dayMeals]) => ({ key, meals: dayMeals }))
}

export default function HistoryPage() {
  const navigate = useNavigate()
  const { meals } = useAppState()
  const groups = groupMealsByDay(meals)

  return (
    <PageTransition>
      <header className="mt-6">
        <h1 className="font-display text-2xl font-bold tracking-tight">Histórico</h1>
        <p className="mt-1 text-sm text-fog">Suas refeições, dia a dia.</p>
      </header>

      {groups.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Histórico vazio"
          description="Assim que você registrar refeições, elas aparecem aqui."
          action={
            <Button
              className="mt-2 h-11 px-5 text-sm"
              onClick={() => navigate('/app/log')}
            >
              Registrar agora
            </Button>
          }
        />
      ) : (
        <div className="mt-5 flex flex-col gap-7">
          {groups.map((group) => {
            const totals = sumMeals(group.meals)
            return (
              <section key={group.key}>
                <div className="flex items-baseline justify-between">
                  <h2 className="font-display text-sm font-semibold tracking-wide capitalize">
                    {dayLabel(group.key)}
                  </h2>
                  <span className="inline-flex items-center gap-1 text-xs text-fog">
                    <Flame className="size-3.5 text-lime" />
                    {totals.calories.toLocaleString('pt-BR')} kcal
                  </span>
                </div>
                <div className="mt-2.5 flex flex-col gap-2.5">
                  {group.meals.map((meal) => (
                    <MealCard key={meal.id} meal={meal} />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </PageTransition>
  )
}
