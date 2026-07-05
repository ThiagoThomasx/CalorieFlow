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

export interface MealInsertPayload {
  user_id: string
  meal_type: MealType
  description: string
  analysis_json: NutritionAnalysis
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  sodium: number
}

/**
 * Arredonda um macro para um inteiro não-negativo — `meal_logs` declara
 * calories/protein/carbs/fat/fiber/sodium como `integer`. O analisador local
 * calcula macros com uma casa decimal (ex.: 28.7g de proteína); enviar esse
 * valor direto ao Postgres falha com "invalid input syntax for type integer"
 * porque a coluna não aceita fração. `analysis_json` guarda a precisão
 * original para referência; só as colunas planas precisam ser inteiras.
 */
function toIntegerColumn(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.round(value))
}

/** Monta o payload de inserção a partir de uma análise — função pura, testável sem rede. */
export function buildMealInsertPayload(userId: string, input: NewMealInput): MealInsertPayload {
  const { analysis } = input
  return {
    user_id: userId,
    meal_type: input.mealType,
    description: analysis.description,
    analysis_json: analysis,
    calories: toIntegerColumn(analysis.calories),
    protein: toIntegerColumn(analysis.protein),
    carbs: toIntegerColumn(analysis.carbs),
    fat: toIntegerColumn(analysis.fat),
    fiber: toIntegerColumn(analysis.fiber),
    sodium: toIntegerColumn(analysis.sodium),
  }
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
    const { data, error } = await requireSupabase()
      .from('meal_logs')
      .insert(buildMealInsertPayload(userId, input))
      .select(MEAL_COLUMNS)
      .single()

    if (error) throw new Error(error.message)
    return toMealLog(data as MealRow)
  },

  /**
   * Remove uma refeição. O filtro por `user_id` é redundante com a RLS
   * (policy `meal_logs_delete_own`), mas evita depender apenas dela.
   */
  async remove(userId: string, mealId: string): Promise<void> {
    const { error } = await requireSupabase()
      .from('meal_logs')
      .delete()
      .eq('id', mealId)
      .eq('user_id', userId)

    if (error) throw new Error(error.message)
  },
}
