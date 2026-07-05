import { useState } from 'react'
import { Check, Coffee, Cookie, Moon, Trash2, UtensilsCrossed, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { MealLog, MealType } from '../../types/nutrition'
import { formatTime, mealTypeLabel } from '../../lib/format'
import { useAppState } from '../../state/AppStateContext'

const MEAL_ICONS: Record<MealType, LucideIcon> = {
  breakfast: Coffee,
  lunch: UtensilsCrossed,
  dinner: Moon,
  snack: Cookie,
}

/** Linha de refeição usada na Home e no Histórico. */
export function MealCard({ meal }: { meal: MealLog }) {
  const { deleteMeal } = useAppState()
  const Icon = MEAL_ICONS[meal.mealType]
  const [isConfirming, setIsConfirming] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleConfirmDelete() {
    if (isDeleting) return
    setIsDeleting(true)
    await deleteMeal(meal.id)
    // Sem setIsDeleting(false) no sucesso: o card some da lista (re-render do pai).
    setIsDeleting(false)
    setIsConfirming(false)
  }

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

      {isConfirming ? (
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={handleConfirmDelete}
            disabled={isDeleting}
            aria-label="Confirmar exclusão"
            className="flex size-8 items-center justify-center rounded-lg bg-amber/15 text-amber transition-colors duration-200 hover:bg-amber/25 disabled:opacity-50"
          >
            <Check className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsConfirming(false)}
            disabled={isDeleting}
            aria-label="Cancelar exclusão"
            className="flex size-8 items-center justify-center rounded-lg text-faint transition-colors duration-200 hover:bg-white/[0.06] hover:text-snow disabled:opacity-50"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsConfirming(true)}
          aria-label={`Excluir refeição ${mealTypeLabel(meal.mealType)}`}
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-faint transition-colors duration-200 hover:bg-white/[0.06] hover:text-amber"
        >
          <Trash2 className="size-4" />
        </button>
      )}
    </div>
  )
}
