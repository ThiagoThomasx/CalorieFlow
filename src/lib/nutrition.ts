import type {
  AnalyzedFoodItem,
  MealLog,
  MealType,
  NutritionAnalysis,
} from '../types/nutrition'

/**
 * Contrato do analisador nutricional.
 *
 * Hoje a implementação é mockada (tabela local de alimentos). Na Sprint 2+
 * basta trocar por uma implementação que chama a IA (edge function / API)
 * mantendo a mesma assinatura — nenhuma tela precisa mudar.
 */
export type NutritionAnalyzer = (text: string) => Promise<NutritionAnalysis>

interface FoodEntry {
  pattern: RegExp
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  sodium: number
}

const FOOD_TABLE: FoodEntry[] = [
  { pattern: /ovo/i, name: 'Ovo', calories: 78, protein: 6, carbs: 1, fat: 5, fiber: 0, sodium: 62 },
  { pattern: /p[ãa]o franc[êe]s/i, name: 'Pão francês', calories: 150, protein: 4, carbs: 29, fat: 2, fiber: 1, sodium: 320 },
  { pattern: /p[ãa]o/i, name: 'Pão', calories: 130, protein: 4, carbs: 25, fat: 2, fiber: 2, sodium: 250 },
  { pattern: /caf[ée] com leite/i, name: 'Café com leite', calories: 90, protein: 4, carbs: 8, fat: 4, fiber: 0, sodium: 55 },
  { pattern: /caf[ée]/i, name: 'Café', calories: 5, protein: 0, carbs: 1, fat: 0, fiber: 0, sodium: 5 },
  { pattern: /arroz/i, name: 'Arroz', calories: 170, protein: 3, carbs: 37, fat: 1, fiber: 1, sodium: 300 },
  { pattern: /feij[ãa]o/i, name: 'Feijão', calories: 115, protein: 7, carbs: 20, fat: 1, fiber: 7, sodium: 380 },
  { pattern: /frango/i, name: 'Frango', calories: 220, protein: 40, carbs: 0, fat: 6, fiber: 0, sodium: 90 },
  { pattern: /carne|bife/i, name: 'Carne bovina', calories: 250, protein: 34, carbs: 0, fat: 12, fiber: 0, sodium: 80 },
  { pattern: /peixe|salm[ãa]o|til[áa]pia/i, name: 'Peixe', calories: 200, protein: 32, carbs: 0, fat: 8, fiber: 0, sodium: 70 },
  { pattern: /salada|alface|legumes/i, name: 'Salada', calories: 45, protein: 2, carbs: 8, fat: 0, fiber: 3, sodium: 30 },
  { pattern: /banana/i, name: 'Banana', calories: 90, protein: 1, carbs: 23, fat: 0, fiber: 3, sodium: 1 },
  { pattern: /ma[çc][ãa]/i, name: 'Maçã', calories: 80, protein: 0, carbs: 21, fat: 0, fiber: 4, sodium: 2 },
  { pattern: /iogurte/i, name: 'Iogurte', calories: 120, protein: 10, carbs: 12, fat: 4, fiber: 0, sodium: 60 },
  { pattern: /aveia/i, name: 'Aveia', calories: 110, protein: 4, carbs: 19, fat: 2, fiber: 3, sodium: 2 },
  { pattern: /queijo/i, name: 'Queijo', calories: 105, protein: 7, carbs: 1, fat: 8, fiber: 0, sodium: 180 },
  { pattern: /leite/i, name: 'Leite', calories: 120, protein: 6, carbs: 10, fat: 6, fiber: 0, sodium: 100 },
  { pattern: /batata[- ]doce/i, name: 'Batata-doce', calories: 115, protein: 2, carbs: 27, fat: 0, fiber: 4, sodium: 40 },
  { pattern: /batata/i, name: 'Batata', calories: 110, protein: 2, carbs: 25, fat: 0, fiber: 2, sodium: 10 },
  { pattern: /whey|shake/i, name: 'Whey protein', calories: 130, protein: 25, carbs: 4, fat: 2, fiber: 0, sodium: 90 },
  { pattern: /tapioca/i, name: 'Tapioca', calories: 150, protein: 0, carbs: 37, fat: 0, fiber: 0, sodium: 5 },
  { pattern: /suco/i, name: 'Suco', calories: 110, protein: 1, carbs: 26, fat: 0, fiber: 0, sodium: 5 },
]

/** Estimativa usada quando o alimento não está na tabela mock. */
const GENERIC_FOOD: Omit<FoodEntry, 'pattern' | 'name'> = {
  calories: 140,
  protein: 6,
  carbs: 18,
  fat: 5,
  fiber: 1,
  sodium: 120,
}

const QUANTITY_WORDS: Record<string, number> = {
  um: 1, uma: 1, dois: 2, duas: 2, tres: 3, três: 3, meia: 0.5, meio: 0.5,
}

const ANALYSIS_DELAY_MS = 900

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function parseQuantity(part: string): number {
  const digits = part.match(/(\d+)/)
  if (digits) return Math.min(Number(digits[1]), 20)

  const firstWord = part.trim().split(/\s+/)[0]?.toLowerCase() ?? ''
  return QUANTITY_WORDS[firstWord] ?? 1
}

function analyzePart(part: string): AnalyzedFoodItem | null {
  const trimmed = part.trim()
  if (trimmed.length < 2) return null

  const quantity = parseQuantity(trimmed)
  const match = FOOD_TABLE.find((entry) => entry.pattern.test(trimmed))
  const base = match ?? { ...GENERIC_FOOD, name: capitalize(trimmed) }

  return {
    name: match ? match.name : capitalize(trimmed),
    quantity,
    calories: Math.round(base.calories * quantity),
    protein: Math.round(base.protein * quantity),
    carbs: Math.round(base.carbs * quantity),
    fat: Math.round(base.fat * quantity),
    fiber: Math.round(base.fiber * quantity),
    sodium: Math.round(base.sodium * quantity),
  }
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/**
 * Analisador mock: divide o texto em itens ("," / " e " / "+"),
 * estima macros por item e soma os totais.
 */
export const analyzeMealText: NutritionAnalyzer = async (text) => {
  await delay(ANALYSIS_DELAY_MS)

  const parts = text.split(/,|\+|\se\s/i).filter((part) => part.trim().length > 0)
  const items = parts
    .map(analyzePart)
    .filter((item): item is AnalyzedFoodItem => item !== null)

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
    name: items[0]?.name ?? 'Refeição',
    description: text.trim(),
    items,
    ...totals,
  }
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
