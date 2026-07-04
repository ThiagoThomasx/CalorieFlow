/**
 * Validação da resposta da IA antes de ela chegar ao app.
 *
 * O structured output do provedor já garante o formato na maioria dos
 * casos, mas o validator é a garantia final — se o provedor for trocado
 * por um que não suporte JSON Schema, nada além deste arquivo segura o app.
 */
import type { AnalyzedItem, RawAnalysis } from './types.ts'

const MIN_TEXT_LENGTH = 2
const MAX_TEXT_LENGTH = 600
const MAX_ITEMS = 30
/** Tolerância na coerência kcal ↔ macros (Atwater): 45% + 30 kcal de folga. */
const MACRO_TOLERANCE_RATIO = 0.45
const MACRO_TOLERANCE_FLAT_KCAL = 30

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: string }

export type AnalysisValidation =
  | { ok: true; value: RawAnalysis; warnings: string[] }
  | { ok: false; reason: string }

/** Valida o texto recebido do frontend. */
export function validateRequestText(input: unknown): ValidationResult<string> {
  if (typeof input !== 'string') {
    return { ok: false, reason: 'Envie o campo "text" com a descrição da refeição.' }
  }
  const text = input.trim()
  if (text.length < MIN_TEXT_LENGTH) {
    return { ok: false, reason: 'Descreva a refeição com um pouco mais de detalhe.' }
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return { ok: false, reason: `Descrição muito longa (máximo ${MAX_TEXT_LENGTH} caracteres).` }
  }
  return { ok: true, value: text }
}

function isFiniteNonNegative(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function validateItem(value: unknown, index: number): string | null {
  if (!isRecord(value)) return `Item ${index + 1} não é um objeto.`
  if (typeof value.name !== 'string' || value.name.trim().length === 0) {
    return `Item ${index + 1} sem nome.`
  }
  if (typeof value.quantity !== 'number' || !Number.isFinite(value.quantity) || value.quantity <= 0) {
    return `Item "${value.name}" com quantidade inválida.`
  }
  if (typeof value.unit !== 'string' || value.unit.trim().length === 0) {
    return `Item "${value.name}" sem unidade.`
  }
  const macroFields = ['calories', 'protein', 'carbs', 'fat', 'fiber', 'sodium'] as const
  for (const field of macroFields) {
    if (!isFiniteNonNegative(value[field])) {
      return `Item "${value.name}" com valor inválido em ${field}.`
    }
  }
  if (!Array.isArray(value.micros)) return `Item "${value.name}" com micros inválidos.`
  for (const micro of value.micros) {
    if (
      !isRecord(micro) ||
      typeof micro.name !== 'string' ||
      !isFiniteNonNegative(micro.amount) ||
      typeof micro.unit !== 'string'
    ) {
      return `Item "${value.name}" com micronutriente malformado.`
    }
  }
  return null
}

/**
 * Coerência kcal ↔ macros (Atwater) é apenas AVISO, nunca rejeição:
 * álcool (cerveja, vinho, caipirinha) tem calorias fora de proteína/
 * carbo/gordura e reprovaria injustamente casos comuns.
 */
function checkMacroCoherence(item: AnalyzedItem): string | null {
  const atwater = item.protein * 4 + item.carbs * 4 + item.fat * 9
  const tolerance = Math.max(atwater, item.calories) * MACRO_TOLERANCE_RATIO + MACRO_TOLERANCE_FLAT_KCAL
  if (Math.abs(atwater - item.calories) > tolerance) {
    return `Item "${item.name}" com calorias pouco coerentes com os macros (atwater=${Math.round(atwater)}, kcal=${Math.round(item.calories)}).`
  }
  return null
}

/**
 * Valida a estrutura do JSON devolvido pela IA (rejeita) e a coerência
 * dos números (apenas avisa via `warnings`, para log). O frontend recebe
 * sempre uma mensagem amigável genérica em caso de rejeição.
 */
export function validateAnalysis(data: unknown): AnalysisValidation {
  if (!isRecord(data)) return { ok: false, reason: 'Resposta da IA não é um objeto JSON.' }

  if (!Array.isArray(data.items) || data.items.length === 0) {
    return { ok: false, reason: 'Nenhum alimento identificado na resposta.' }
  }
  if (data.items.length > MAX_ITEMS) {
    return { ok: false, reason: `Resposta com itens demais (${data.items.length}).` }
  }

  for (let i = 0; i < data.items.length; i++) {
    const structural = validateItem(data.items[i], i)
    if (structural) return { ok: false, reason: structural }
  }

  const items = data.items as AnalyzedItem[]
  const warnings: string[] = []
  for (const item of items) {
    const coherence = checkMacroCoherence(item)
    if (coherence) warnings.push(coherence)
  }

  if (!isRecord(data.totals)) return { ok: false, reason: 'Totais ausentes.' }
  const totalFields = ['calories', 'protein', 'carbs', 'fat', 'fiber', 'sodium'] as const
  for (const field of totalFields) {
    if (!isFiniteNonNegative(data.totals[field])) {
      return { ok: false, reason: `Total inválido em ${field}.` }
    }
  }

  if (
    typeof data.confidence !== 'number' ||
    !Number.isFinite(data.confidence) ||
    data.confidence < 0 ||
    data.confidence > 1
  ) {
    return { ok: false, reason: 'Confidence fora do intervalo 0–1.' }
  }

  return { ok: true, value: data as unknown as RawAnalysis, warnings }
}
