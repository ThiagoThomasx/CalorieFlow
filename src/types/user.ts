/** Perfil público do usuário (tabela profiles). */
export interface Profile {
  id: string
  displayName: string | null
  avatarUrl: string | null
}

/** Resumo de atividade física de um dia (tabela daily_activity). */
export interface DailyActivity {
  minutes: number
  caloriesBurned: number
  type: string | null
}
