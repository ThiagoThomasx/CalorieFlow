import { FunctionsFetchError, FunctionsHttpError, FunctionsRelayError } from '@supabase/supabase-js'
import type { AnalyzedFoodItem, NutritionAnalysis } from '../../types/nutrition'
import type { NutritionAnalyzer } from '../../lib/nutrition'
import { requireSupabase } from '../../lib/supabase'
import { analyzeMealLocally } from './localAnalyzer'

export { LOCAL_FALLBACK_MODEL } from './localAnalyzer'

/**
 * Serviço de análise nutricional por IA.
 *
 * Única porta do frontend para a Edge Function `nutrition-analysis` —
 * nenhuma tela conhece API, modelo ou provedor. A troca de LLM acontece
 * inteiramente no backend (veja supabase/functions/nutrition-analysis).
 */

const FUNCTION_NAME = 'nutrition-analysis'

export const OFFLINE_MESSAGE =
  'Você está offline. Conecte-se à internet para analisar a refeição — seu texto foi preservado.'

const GENERIC_ERROR = 'Não foi possível analisar a refeição agora. Tente novamente.'

/** Formato devolvido pela Edge Function (contrato da Sprint 3). */
interface AnalysisResponse {
  items: Array<{
    name: string
    quantity: number
    unit: string
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber: number
    sodium: number
    micros: Array<{ name: string; amount: number; unit: string }>
  }>
  totals: {
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber: number
    sodium: number
  }
  confidence: number
  meta: {
    model: string
    parserVersion: string
    durationMs: number
  }
}

function toAnalysis(text: string, response: AnalysisResponse): NutritionAnalysis {
  const items: AnalyzedFoodItem[] = response.items.map((item) => ({
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    calories: item.calories,
    protein: item.protein,
    carbs: item.carbs,
    fat: item.fat,
    fiber: item.fiber,
    sodium: item.sodium,
    micros: item.micros,
  }))

  return {
    name: items[0]?.name ?? 'Refeição',
    description: text.trim(),
    items,
    calories: response.totals.calories,
    protein: response.totals.protein,
    carbs: response.totals.carbs,
    fat: response.totals.fat,
    fiber: response.totals.fiber,
    sodium: response.totals.sodium,
    confidence: response.confidence,
    sourceText: text.trim(),
    parserVersion: response.meta.parserVersion,
    model: response.meta.model,
    analyzedAt: new Date().toISOString(),
  }
}

/** Extrai a mensagem amigável enviada pela Edge Function, se houver. */
async function extractFunctionError(error: FunctionsHttpError): Promise<string> {
  try {
    const body = (await error.context.json()) as { error?: string }
    if (body?.error) return body.error
  } catch {
    // corpo não-JSON — cai na mensagem genérica
  }
  return GENERIC_ERROR
}

/**
 * Decide se vale cair para a análise local: função não deployada (404),
 * IA não configurada / instável no backend (500/503) ou falha de relay.
 * Erros semânticos (400 texto inválido, 401 sessão, 422 não interpretou,
 * 429 rate limit) são mostrados ao usuário — o fallback não os mascara.
 */
function isFunctionUnavailable(error: unknown): boolean {
  if (error instanceof FunctionsRelayError || error instanceof FunctionsFetchError) return true
  if (error instanceof FunctionsHttpError) {
    const status = error.context?.status
    return status === 404 || status === 500 || status === 503
  }
  return false
}

/**
 * Analisador nutricional real (IA via Edge Function).
 * Mesma assinatura do contrato `NutritionAnalyzer` — troca transparente
 * em relação ao mock das sprints anteriores.
 *
 * Se a Edge Function estiver indisponível (não deployada, sem secret ou
 * fora do ar), cai para a estimativa local gratuita, marcada com
 * `model: LOCAL_FALLBACK_MODEL` para a UI sinalizar a baixa precisão.
 */
export const analyzeMealWithAI: NutritionAnalyzer = async (text) => {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error(OFFLINE_MESSAGE)
  }

  const supabase = requireSupabase()
  const { data, error } = await supabase.functions.invoke<AnalysisResponse>(FUNCTION_NAME, {
    body: { text },
  })

  if (error) {
    if (isFunctionUnavailable(error)) {
      return analyzeMealLocally(text)
    }
    if (error instanceof FunctionsHttpError) {
      throw new Error(await extractFunctionError(error))
    }
    throw new Error(GENERIC_ERROR)
  }

  if (!data || !Array.isArray(data.items) || data.items.length === 0) {
    throw new Error(GENERIC_ERROR)
  }

  return toAnalysis(text, data)
}
