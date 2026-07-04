/**
 * Parser: transforma a resposta bruta da IA nos objetos internos da API.
 * Não conhece o provedor — recebe texto, devolve estruturas tipadas.
 */
import type {
  AnalysisMeta,
  AnalysisResponse,
  AnalysisTotals,
  AnalyzedItem,
  RawAnalysis,
} from './types.ts'

/** Arredonda para 1 casa decimal (macros) mantendo número. */
function round1(value: number): number {
  return Math.round(value * 10) / 10
}

/**
 * Extrai o JSON do texto do LLM. Com structured outputs o texto já é JSON
 * puro, mas provedores alternativos costumam envolver em cercas de código.
 */
export function extractJson(rawText: string): unknown {
  const trimmed = rawText.trim()
  const unfenced = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  try {
    return JSON.parse(unfenced)
  } catch {
    // Última tentativa: pega do primeiro "{" ao último "}".
    const start = unfenced.indexOf('{')
    const end = unfenced.lastIndexOf('}')
    if (start === -1 || end <= start) return null
    try {
      return JSON.parse(unfenced.slice(start, end + 1))
    } catch {
      return null
    }
  }
}

function normalizeItem(item: AnalyzedItem): AnalyzedItem {
  return {
    name: item.name.trim(),
    quantity: round1(item.quantity),
    unit: item.unit.trim(),
    calories: Math.round(item.calories),
    protein: round1(item.protein),
    carbs: round1(item.carbs),
    fat: round1(item.fat),
    fiber: round1(item.fiber),
    sodium: Math.round(item.sodium),
    micros: item.micros.map((micro) => ({
      name: micro.name.trim(),
      amount: round1(micro.amount),
      unit: micro.unit.trim(),
    })),
  }
}

/** Totais sempre recalculados a partir dos itens — fonte única de verdade. */
export function sumItems(items: AnalyzedItem[]): AnalysisTotals {
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
    calories: Math.round(totals.calories),
    protein: round1(totals.protein),
    carbs: round1(totals.carbs),
    fat: round1(totals.fat),
    fiber: round1(totals.fiber),
    sodium: Math.round(totals.sodium),
  }
}

/** Monta a resposta final a partir da análise validada. */
export function toAnalysisResponse(raw: RawAnalysis, meta: AnalysisMeta): AnalysisResponse {
  const items = raw.items.map(normalizeItem)
  return {
    items,
    totals: sumItems(items),
    confidence: Math.min(1, Math.max(0, round1(raw.confidence))),
    meta,
  }
}
