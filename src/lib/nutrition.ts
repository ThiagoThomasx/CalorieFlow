import type {
  AnalyzedFoodItem,
  MealLog,
  MealType,
  NutritionAnalysis,
} from '../types/nutrition'

/**
 * Contrato do analisador nutricional.
 *
 * Desde a Sprint 3 a implementação real vive em
 * `src/services/ai/NutritionService.ts` (IA via Supabase Edge Function).
 * Qualquer nova fonte de análise (foto, voz…) deve implementar esta
 * mesma assinatura — nenhuma tela precisa mudar.
 */
export type NutritionAnalyzer = (text: string) => Promise<NutritionAnalysis>

function round1(value: number): number {
  return Math.round(value * 10) / 10
}

/** Recalcula os totais de uma análise a partir dos itens (imutável). */
export function withRecomputedTotals(
  analysis: NutritionAnalysis,
  items: AnalyzedFoodItem[],
): NutritionAnalysis {
  const totals = items.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
      fiber: acc.fiber + item.fiber,
      sodium: acc.sodium + item.sodium,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0 },
  )

  return {
    ...analysis,
    items,
    name: items[0]?.name ?? analysis.name,
    calories: Math.round(totals.calories),
    protein: round1(totals.protein),
    carbs: round1(totals.carbs),
    fat: round1(totals.fat),
    fiber: round1(totals.fiber),
    sodium: Math.round(totals.sodium),
  }
}

/**
 * Ajusta a quantidade de um item escalando os macros proporcionalmente
 * (os valores por unidade são derivados da quantidade original da IA).
 */
export function updateItemQuantity(
  analysis: NutritionAnalysis,
  index: number,
  quantity: number,
): NutritionAnalysis {
  const item = analysis.items[index]
  if (!item || quantity <= 0 || item.quantity <= 0) return analysis

  const ratio = quantity / item.quantity
  const updated: AnalyzedFoodItem = {
    ...item,
    quantity: round1(quantity),
    calories: Math.round(item.calories * ratio),
    protein: round1(item.protein * ratio),
    carbs: round1(item.carbs * ratio),
    fat: round1(item.fat * ratio),
    fiber: round1(item.fiber * ratio),
    sodium: Math.round(item.sodium * ratio),
    micros: item.micros?.map((micro) => ({ ...micro, amount: round1(micro.amount * ratio) })),
  }

  const items = analysis.items.map((current, i) => (i === index ? updated : current))
  return withRecomputedTotals(analysis, items)
}

/** Remove um item da análise, recalculando os totais. */
export function removeAnalysisItem(
  analysis: NutritionAnalysis,
  index: number,
): NutritionAnalysis {
  const items = analysis.items.filter((_, i) => i !== index)
  return withRecomputedTotals(analysis, items)
}

/** Acrescenta itens (ex.: vindos de uma nova análise) e recalcula totais. */
export function appendAnalysisItems(
  analysis: NutritionAnalysis,
  newItems: AnalyzedFoodItem[],
): NutritionAnalysis {
  return withRecomputedTotals(analysis, [...analysis.items, ...newItems])
}

/** Sugere o tipo de refeição pelo horário atual. */
export function suggestMealType(date: Date = new Date()): MealType {
  const hour = date.getHours()
  if (hour < 10) return 'breakfast'
  if (hour < 15) return 'lunch'
  if (hour < 18) return 'snack'
  return 'dinner'
}

export interface ConsumedTotals {
  calories: number
  protein: number
  carbs: number
  fat: number
}

/** Soma os macros de uma lista de refeições (ex.: refeições de hoje). */
export function sumMeals(meals: MealLog[]): ConsumedTotals {
  return meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.calories,
      protein: acc.protein + meal.protein,
      carbs: acc.carbs + meal.carbs,
      fat: acc.fat + meal.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  )
}
