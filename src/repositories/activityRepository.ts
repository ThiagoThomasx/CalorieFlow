import type { DailyActivity } from '../types/user'
import { requireSupabase } from '../lib/supabase'

interface ActivityRow {
  minutes: number
  calories_burned: number
  type: string | null
}

/** Acesso à tabela daily_activity (uma linha por usuário por dia). */
export const activityRepository = {
  /** Atividade do dia — null quando não há registro. */
  async getForDate(userId: string, date: string): Promise<DailyActivity | null> {
    const { data, error } = await requireSupabase()
      .from('daily_activity')
      .select('minutes, calories_burned, type')
      .eq('user_id', userId)
      .eq('date', date)
      .maybeSingle()

    if (error) throw new Error(error.message)
    if (!data) return null

    const row = data as ActivityRow
    return {
      minutes: row.minutes,
      caloriesBurned: row.calories_burned,
      type: row.type,
    }
  },
}
