import type { MealType } from '../types/nutrition'

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Café da manhã',
  lunch: 'Almoço',
  dinner: 'Jantar',
  snack: 'Lanche',
}

export function mealTypeLabel(type: MealType): string {
  return MEAL_TYPE_LABELS[type]
}

/** "sexta-feira, 4 de julho" */
export function formatFullDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date)
}

/** "04/07" */
export function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  }).format(date)
}

/** "07:40" */
export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function greetingForHour(hour: number): string {
  if (hour < 5) return 'Boa madrugada'
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

/** Chave de agrupamento por dia local: "2026-07-04" */
export function dayKey(iso: string): string {
  const date = new Date(iso)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function dayLabel(key: string): string {
  const today = dayKey(new Date().toISOString())
  if (key === today) return 'Hoje'

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  if (key === dayKey(yesterday.toISOString())) return 'Ontem'

  const [year, month, day] = key.split('-').map(Number)
  return formatFullDate(new Date(year, month - 1, day))
}

/** "04/07/2026, 14:32" */
export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function formatMl(ml: number): string {
  if (ml >= 1000) {
    const liters = ml / 1000
    return `${liters.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} L`
  }
  return `${ml} ml`
}
