import { requireSupabase } from '../lib/supabase'

interface WaterRow {
  water_ml: number
}

/** Acesso à tabela daily_water (uma linha por usuário por dia). */
export const waterRepository = {
  /** Total de água (ml) do dia — 0 quando ainda não há registro. */
  async getForDate(userId: string, date: string): Promise<number> {
    const { data, error } = await requireSupabase()
      .from('daily_water')
      .select('water_ml')
      .eq('user_id', userId)
      .eq('date', date)
      .maybeSingle()

    if (error) throw new Error(error.message)
    return data ? (data as WaterRow).water_ml : 0
  },

  /** Grava o total acumulado do dia (upsert por user_id + date). */
  async setForDate(userId: string, date: string, waterMl: number): Promise<void> {
    const { error } = await requireSupabase()
      .from('daily_water')
      .upsert(
        { user_id: userId, date, water_ml: Math.max(0, waterMl) },
        { onConflict: 'user_id,date' },
      )

    if (error) throw new Error(error.message)
  },
}
