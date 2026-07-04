import type { UserGoals } from '../types/nutrition'
import { requireSupabase } from '../lib/supabase'

interface GoalsRow {
  calories_goal: number
  protein_goal: number
  carbs_goal: number
  fat_goal: number
  water_goal_ml: number
  objective: UserGoals['objective']
}

const GOALS_COLUMNS =
  'calories_goal, protein_goal, carbs_goal, fat_goal, water_goal_ml, objective'

function toUserGoals(row: GoalsRow): UserGoals {
  return {
    caloriesGoal: row.calories_goal,
    proteinGoal: row.protein_goal,
    carbsGoal: row.carbs_goal,
    fatGoal: row.fat_goal,
    waterGoalMl: row.water_goal_ml,
    objective: row.objective,
  }
}

/** Acesso à tabela user_goals (uma linha por usuário). */
export const goalsRepository = {
  async getByUser(userId: string): Promise<UserGoals | null> {
    const { data, error } = await requireSupabase()
      .from('user_goals')
      .select(GOALS_COLUMNS)
      .eq('user_id', userId)
      .maybeSingle()

    if (error) throw new Error(error.message)
    return data ? toUserGoals(data as GoalsRow) : null
  },

  async upsert(userId: string, goals: UserGoals): Promise<void> {
    const { error } = await requireSupabase()
      .from('user_goals')
      .upsert(
        {
          user_id: userId,
          calories_goal: goals.caloriesGoal,
          protein_goal: goals.proteinGoal,
          carbs_goal: goals.carbsGoal,
          fat_goal: goals.fatGoal,
          water_goal_ml: goals.waterGoalMl,
          objective: goals.objective,
        },
        { onConflict: 'user_id' },
      )

    if (error) throw new Error(error.message)
  },
}
