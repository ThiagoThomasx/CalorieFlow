export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export type Objective = 'lose_fat' | 'maintain' | 'gain_muscle'

export interface MealLog {
  id: string
  userId: string
  description: string
  mealType: MealType
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  sodium: number
  createdAt: string
}

export interface UserGoals {
  caloriesGoal: number
  proteinGoal: number
  carbsGoal: number
  fatGoal: number
  waterGoalMl: number
  objective: Objective
}

/** Micronutriente estimado pela IA (quando disponível). */
export interface MicroNutrient {
  name: string
  amount: number
  unit: string
}

/** Item individual identificado dentro de uma descrição de refeição. */
export interface AnalyzedFoodItem {
  name: string
  quantity: number
  /** Unidade da quantidade ("unidade", "g", "fatia"…). Ausente em dados antigos (mock). */
  unit?: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  sodium: number
  micros?: MicroNutrient[]
}

/**
 * Resultado da análise nutricional de um texto livre.
 * Os campos opcionais existem desde a Sprint 3 (análise por IA) e ficam
 * gravados em meal_logs.analysis_json — histórico para evoluir a IA.
 */
export interface NutritionAnalysis {
  name: string
  description: string
  items: AnalyzedFoodItem[]
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  sodium: number
  /** Confiança geral da IA (0–1). */
  confidence?: number
  /** Texto original digitado pelo usuário. */
  sourceText?: string
  /** Versão do parser da Edge Function que gerou a análise. */
  parserVersion?: string
  /** Modelo de IA utilizado. */
  model?: string
  /** Momento da análise (ISO). */
  analyzedAt?: string
}
