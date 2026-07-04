/**
 * Contratos da Edge Function nutrition-analysis.
 *
 * O frontend depende apenas de AnalysisResponse — qualquer provedor de IA
 * pode ser trocado desde que a resposta final respeite este formato.
 */

/** Versão do parser gravada no histórico (analysis_json.parserVersion). */
export const PARSER_VERSION = '1.0.0'

/** Corpo aceito pela função. */
export interface AnalysisRequest {
  text: string
}

/** Micronutriente estimado (quando a IA souber informar). */
export interface MicroNutrient {
  name: string
  amount: number
  unit: string
}

/** Item de alimento identificado no texto. */
export interface AnalyzedItem {
  name: string
  quantity: number
  unit: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  sodium: number
  micros: MicroNutrient[]
}

export interface AnalysisTotals {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  sodium: number
}

/** Estrutura bruta esperada do JSON devolvido pelo LLM. */
export interface RawAnalysis {
  items: AnalyzedItem[]
  totals: AnalysisTotals
  confidence: number
}

/** Metadados para observabilidade e evolução do histórico. */
export interface AnalysisMeta {
  model: string
  parserVersion: string
  durationMs: number
  inputTokens: number | null
  outputTokens: number | null
}

/** Resposta de sucesso da função. */
export interface AnalysisResponse {
  items: AnalyzedItem[]
  totals: AnalysisTotals
  confidence: number
  meta: AnalysisMeta
}

/** Resposta de erro — mensagem amigável em pt-BR. */
export interface AnalysisError {
  error: string
}
