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

export interface DailySummary {
  date: string
  caloriesConsumed: number
  caloriesGoal: number
  proteinConsumed: number
  proteinGoal: number
  carbsConsumed: number
  carbsGoal: number
  fatConsumed: number
  fatGoal: number
  waterMl: number
  waterGoalMl: number
  activityMinutes: number
  caloriesBurned: number
}

export interface UserGoals {
  caloriesGoal: number
  proteinGoal: number
  carbsGoal: number
  fatGoal: number
  waterGoalMl: number
  objective: Objective
}

/** Item individual identificado dentro de uma descrição de refeição. */
export interface AnalyzedFoodItem {
  name: string
  quantity: number
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  sodium: number
}

/** Resultado da análise nutricional de um texto livre. */
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
}
