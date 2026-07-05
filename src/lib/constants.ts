import type { Objective, UserGoals } from '../types/nutrition'

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

export interface ObjectivePreset {
  caloriesGoal: number
  proteinGoal: number
  waterGoalMl: number
}

/**
 * Presets simples de metas por objetivo — usados apenas como sugestão inicial.
 * Sem onboarding com peso/altura/idade/gasto energético ainda, são valores
 * fixos e editáveis, não um cálculo de TDEE. Ajustar quando o app ganhar
 * esses dados do usuário.
 */
export const OBJECTIVE_PRESETS: Record<Objective, ObjectivePreset> = {
  lose_fat: { caloriesGoal: 2000, proteinGoal: 160, waterGoalMl: 2500 },
  maintain: { caloriesGoal: 2400, proteinGoal: 140, waterGoalMl: 2500 },
  gain_muscle: { caloriesGoal: 2800, proteinGoal: 160, waterGoalMl: 3000 },
}
