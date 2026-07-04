import type { AnalyzedFoodItem } from '../../types/nutrition'
import type { NutritionAnalyzer } from '../../lib/nutrition'
import { withRecomputedTotals } from '../../lib/nutrition'

/**
 * Analisador local de emergência (tabela offline).
 *
 * Usado apenas quando a Edge Function de IA está indisponível ou não foi
 * deployada — o app continua utilizável sem custo externo. A análise é
 * marcada com model = LOCAL_FALLBACK_MODEL e confiança baixa para a UI
 * deixar claro que é uma estimativa aproximada.
 */

export const LOCAL_FALLBACK_MODEL = 'local-fallback'
const LOCAL_PARSER_VERSION = 'local-1.0.0'
const LOCAL_CONFIDENCE = 0.3

interface FoodEntry {
  pattern: RegExp
  name: string
  unit: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  sodium: number
}

const FOOD_TABLE: FoodEntry[] = [
  { pattern: /ovo/i, name: 'Ovo', unit: 'unidade', calories: 78, protein: 6, carbs: 1, fat: 5, fiber: 0, sodium: 62 },
  { pattern: /p[ãa]o franc[êe]s/i, name: 'Pão francês', unit: 'unidade', calories: 150, protein: 4, carbs: 29, fat: 2, fiber: 1, sodium: 320 },
  { pattern: /p[ãa]o/i, name: 'Pão', unit: 'fatia', calories: 130, protein: 4, carbs: 25, fat: 2, fiber: 2, sodium: 250 },
  { pattern: /caf[ée] com leite/i, name: 'Café com leite', unit: 'xícara', calories: 90, protein: 4, carbs: 8, fat: 4, fiber: 0, sodium: 55 },
  { pattern: /caf[ée]/i, name: 'Café', unit: 'xícara', calories: 5, protein: 0, carbs: 1, fat: 0, fiber: 0, sodium: 5 },
  { pattern: /arroz/i, name: 'Arroz', unit: 'porção', calories: 170, protein: 3, carbs: 37, fat: 1, fiber: 1, sodium: 300 },
  { pattern: /feij[ãa]o/i, name: 'Feijão', unit: 'concha', calories: 115, protein: 7, carbs: 20, fat: 1, fiber: 7, sodium: 380 },
  { pattern: /frango/i, name: 'Frango', unit: 'porção', calories: 220, protein: 40, carbs: 0, fat: 6, fiber: 0, sodium: 90 },
  { pattern: /carne|bife/i, name: 'Carne bovina', unit: 'porção', calories: 250, protein: 34, carbs: 0, fat: 12, fiber: 0, sodium: 80 },
  { pattern: /peixe|salm[ãa]o|til[áa]pia/i, name: 'Peixe', unit: 'porção', calories: 200, protein: 32, carbs: 0, fat: 8, fiber: 0, sodium: 70 },
  { pattern: /salada|alface|legumes/i, name: 'Salada', unit: 'porção', calories: 45, protein: 2, carbs: 8, fat: 0, fiber: 3, sodium: 30 },
  { pattern: /banana/i, name: 'Banana', unit: 'unidade', calories: 90, protein: 1, carbs: 23, fat: 0, fiber: 3, sodium: 1 },
  { pattern: /ma[çc][ãa]/i, name: 'Maçã', unit: 'unidade', calories: 80, protein: 0, carbs: 21, fat: 0, fiber: 4, sodium: 2 },
  { pattern: /iogurte/i, name: 'Iogurte', unit: 'unidade', calories: 120, protein: 10, carbs: 12, fat: 4, fiber: 0, sodium: 60 },
  { pattern: /aveia/i, name: 'Aveia', unit: 'porção', calories: 110, protein: 4, carbs: 19, fat: 2, fiber: 3, sodium: 2 },
  { pattern: /queijo/i, name: 'Queijo', unit: 'fatia', calories: 105, protein: 7, carbs: 1, fat: 8, fiber: 0, sodium: 180 },
  { pattern: /leite/i, name: 'Leite', unit: 'copo', calories: 120, protein: 6, carbs: 10, fat: 6, fiber: 0, sodium: 100 },
  { pattern: /batata[- ]doce/i, name: 'Batata-doce', unit: 'porção', calories: 115, protein: 2, carbs: 27, fat: 0, fiber: 4, sodium: 40 },
  { pattern: /batata/i, name: 'Batata', unit: 'porção', calories: 110, protein: 2, carbs: 25, fat: 0, fiber: 2, sodium: 10 },
  { pattern: /whey|shake/i, name: 'Whey protein', unit: 'dose', calories: 130, protein: 25, carbs: 4, fat: 2, fiber: 0, sodium: 90 },
  { pattern: /tapioca/i, name: 'Tapioca', unit: 'unidade', calories: 150, protein: 0, carbs: 37, fat: 0, fiber: 0, sodium: 5 },
  { pattern: /suco/i, name: 'Suco', unit: 'copo', calories: 110, protein: 1, carbs: 26, fat: 0, fiber: 0, sodium: 5 },
  { pattern: /pizza/i, name: 'Pizza', unit: 'fatia', calories: 285, protein: 12, carbs: 36, fat: 10, fiber: 2, sodium: 640 },
  { pattern: /big ?mac/i, name: 'Big Mac', unit: 'unidade', calories: 503, protein: 27, carbs: 44, fat: 25, fiber: 3, sodium: 970 },
  { pattern: /coca.{0,3}zero|refri.{0,10}zero/i, name: 'Refrigerante zero', unit: 'copo', calories: 1, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 28 },
  { pattern: /coca|refrigerante/i, name: 'Refrigerante', unit: 'copo', calories: 85, protein: 0, carbs: 21, fat: 0, fiber: 0, sodium: 9 },
  { pattern: /a[çc]a[íi]/i, name: 'Açaí', unit: 'tigela', calories: 380, protein: 4, carbs: 60, fat: 14, fiber: 6, sodium: 15 },
  { pattern: /feijoada/i, name: 'Feijoada', unit: 'porção', calories: 450, protein: 28, carbs: 30, fat: 24, fiber: 9, sodium: 1100 },
]

/** Estimativa usada quando o alimento não está na tabela local. */
const GENERIC_FOOD = {
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

function parseQuantity(part: string): number {
  const digits = part.match(/(\d+)/)
  if (digits) return Math.min(Number(digits[1]), 20)

  const firstWord = part.trim().split(/\s+/)[0]?.toLowerCase() ?? ''
  return QUANTITY_WORDS[firstWord] ?? 1
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function analyzePart(part: string): AnalyzedFoodItem | null {
  const trimmed = part.trim()
  if (trimmed.length < 2) return null

  const quantity = parseQuantity(trimmed)
  const match = FOOD_TABLE.find((entry) => entry.pattern.test(trimmed))
  const base = match ?? { ...GENERIC_FOOD, name: capitalize(trimmed), unit: 'porção' }

  return {
    name: base.name,
    quantity,
    unit: base.unit,
    calories: Math.round(base.calories * quantity),
    protein: Math.round(base.protein * quantity),
    carbs: Math.round(base.carbs * quantity),
    fat: Math.round(base.fat * quantity),
    fiber: Math.round(base.fiber * quantity),
    sodium: Math.round(base.sodium * quantity),
  }
}

/**
 * Fallback local: divide o texto em itens ("," / " e " / "+") e estima
 * macros pela tabela. Mesma assinatura do analisador de IA.
 */
export const analyzeMealLocally: NutritionAnalyzer = async (text) => {
  const parts = text.split(/,|\+|\se\s/i).filter((part) => part.trim().length > 0)
  const items = parts
    .map(analyzePart)
    .filter((item): item is AnalyzedFoodItem => item !== null)

  if (items.length === 0) {
    throw new Error('Não consegui identificar alimentos no texto. Tente algo como "2 ovos e 1 banana".')
  }

  const base = {
    name: items[0]?.name ?? 'Refeição',
    description: text.trim(),
    items,
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sodium: 0,
    confidence: LOCAL_CONFIDENCE,
    sourceText: text.trim(),
    parserVersion: LOCAL_PARSER_VERSION,
    model: LOCAL_FALLBACK_MODEL,
    analyzedAt: new Date().toISOString(),
  }
  return withRecomputedTotals(base, items)
}
