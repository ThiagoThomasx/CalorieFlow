import type { MealLog, MealType, NutritionAnalysis } from '../types/nutrition'
import { requireSupabase } from '../lib/supabase'

const MEAL_COLUMNS =
  'id, user_id, meal_type, description, analysis_json, calories, protein, carbs, fat, fiber, sodium, created_at'

const MAX_MEALS = 300

interface MealRow {
  id: string
  user_id: string
  meal_type: MealType
  description: string
  analysis_json: NutritionAnalysis | null
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  sodium: number
  created_at: string
}

function toMealLog(row: MealRow): MealLog {
  return {
    id: row.id,
    userId: row.user_id,
    mealType: row.meal_type,
    description: row.description,
    calories: row.calories,
    protein: row.protein,
    carbs: row.carbs,
    fat: row.fat,
    fiber: row.fiber,
    sodium: row.sodium,
    createdAt: row.created_at,
  }
}

export interface NewMealInput {
  mealType: MealType
  analysis: NutritionAnalysis
}

/** Acesso à tabela meal_logs — única porta de entrada para refeições. */
export const mealsRepository = {
  /** Refeições do usuário, mais recentes primeiro. */
  async listByUser(userId: string): Promise<MealLog[]> {
    const { data, error } = await requireSupabase()
      .from('meal_logs')
      .select(MEAL_COLUMNS)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(MAX_MEALS)

    if (error) throw new Error(error.message)
    return ((data ?? []) as MealRow[]).map(toMealLog)
  },

  /** Persiste uma refeição e retorna o registro salvo. */
  async create(userId: string, input: NewMealInput): Promise<MealLog> {
    const { analysis } = input
    const { data, error } = await requireSupabase()
      .from('meal_logs')
      .insert({
        user_id: userId,
        meal_type: input.mealType,
        description: analysis.description,
        analysis_json: analysis,
        calories: analysis.calories,
        protein: analysis.protein,
        carbs: analysis.carbs,
        fat: analysis.fat,
        fiber: analysis.fiber,
        sodium: analysis.sodium,
      })
      .select(MEAL_COLUMNS)
      .single()

    if (error) throw new Error(error.message)
    return toMealLog(data as MealRow)
  },
}
