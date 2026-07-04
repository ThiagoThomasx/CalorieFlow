import { Coffee, Cookie, Moon, UtensilsCrossed } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { MealLog, MealType } from '../../types/nutrition'
import { formatTime, mealTypeLabel } from '../../lib/format'

const MEAL_ICONS: Record<MealType, LucideIcon> = {
  breakfast: Coffee,
  lunch: UtensilsCrossed,
  dinner: Moon,
  snack: Cookie,
}

/** Linha de refeição usada na Home e no Histórico. */
export function MealCard({ meal }: { meal: MealLog }) {
  const Icon = MEAL_ICONS[meal.mealType]

  return (
    <div className="glass flex items-center gap-3.5 rounded-2xl p-3.5 transition-colors duration-200 hover:bg-white/[0.05]">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.06]">
        <Icon className="size-5 text-cyan" strokeWidth={1.8} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-sm font-semibold">{mealTypeLabel(meal.mealType)}</p>
          <span className="shrink-0 text-xs text-faint">{formatTime(meal.createdAt)}</span>
        </div>
        <p className="mt-0.5 truncate text-xs text-fog">{meal.description}</p>
        <div className="mt-1.5 flex items-center gap-3 text-[11px] text-faint">
          <span className="font-medium text-snow/90">{meal.calories} kcal</span>
          <span>P {meal.protein}g</span>
          <span>C {meal.carbs}g</span>
          <span>G {meal.fat}g</span>
        </div>
      </div>
    </div>
  )
}
