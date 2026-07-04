import type { UserGoals } from '../types/nutrition'

/** Metas padrão exibidas enquanto o usuário ainda não personalizou as suas. */
export const DEFAULT_GOALS: UserGoals = {
  caloriesGoal: 2400,
  proteinGoal: 160,
  carbsGoal: 260,
  fatGoal: 75,
  waterGoalMl: 3000,
  objective: 'maintain',
}

export const CUP_SIZE_ML = 250
