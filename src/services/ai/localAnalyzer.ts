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
/** Confiança quando todos os itens do texto casaram com a tabela local. */
const LOCAL_CONFIDENCE = 0.3
/** Confiança reduzida quando algum item não foi reconhecido (estimativa genérica). */
const LOCAL_CONFIDENCE_UNMATCHED = 0.12

/** Sufixo anexado ao nome de itens não reconhecidos — nunca inventamos um alimento específico. */
export const UNMATCHED_ITEM_SUFFIX = ' (não identificado)'

/**
 * Base de cálculo do valor nutricional de cada alimento:
 * - 'weight'  → `calories`/macros valem por 100g (arroz, carnes, legumes…)
 * - 'volume'  → valem por 100ml (bebidas)
 * - 'count'   → valem por unidade/porção informal (ovo, pão, fatia…)
 * Isso evita tratar "100 gramas" como se fossem "100 porções".
 */
type Basis = 'weight' | 'volume' | 'count'

interface FoodEntry {
  /**
   * Palavras/frases normalizadas (sem acento, minúsculas) que identificam o
   * alimento. O match exige a palavra/frase INTEIRA (limite de palavra), nunca
   * um prefixo — é o que evita "macarrão" casar com o alias "maca" da maçã.
   */
  aliases: string[]
  name: string
  unit: string
  basis: Basis
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  sodium: number
}

/** Remove acentos e normaliza hífen/maiúsculas para permitir "macarrao" == "macarrão". */
function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/-/g, ' ')
    .toLowerCase()
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Mínimo de caracteres por alias — evita que fragmentos curtos demais deem match parcial indevido. */
const MIN_ALIAS_LENGTH = 3

/** Testa se `alias` aparece como palavra/frase inteira em `normalizedText` (com limites de palavra). */
function matchesAlias(normalizedText: string, alias: string): boolean {
  const pattern = new RegExp(`\\b${escapeRegExp(alias)}\\b`)
  return pattern.test(normalizedText)
}

/**
 * Tabela de alimentos, ordenada do mais específico para o mais genérico —
 * quando duas entradas poderiam casar com o mesmo texto (ex.: "pão francês"
 * vs "pão"), a mais específica precisa vir primeiro para vencer.
 */
const FOOD_TABLE: FoodEntry[] = [
  { aliases: ['ovo', 'ovos'], name: 'Ovo', unit: 'unidade', basis: 'count', calories: 78, protein: 6, carbs: 1, fat: 5, fiber: 0, sodium: 62 },
  { aliases: ['pao frances', 'paes franceses'], name: 'Pão francês', unit: 'unidade', basis: 'count', calories: 150, protein: 4, carbs: 29, fat: 2, fiber: 1, sodium: 320 },
  { aliases: ['pao', 'paes'], name: 'Pão', unit: 'fatia', basis: 'count', calories: 130, protein: 4, carbs: 25, fat: 2, fiber: 2, sodium: 250 },
  { aliases: ['cafe com leite'], name: 'Café com leite', unit: 'ml', basis: 'volume', calories: 45, protein: 2, carbs: 4, fat: 2, fiber: 0, sodium: 28 },
  { aliases: ['cafe'], name: 'Café', unit: 'ml', basis: 'volume', calories: 2, protein: 0.1, carbs: 0.3, fat: 0, fiber: 0, sodium: 2 },
  { aliases: ['arroz'], name: 'Arroz', unit: 'g', basis: 'weight', calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, sodium: 1 },
  { aliases: ['feijao'], name: 'Feijão', unit: 'concha', basis: 'count', calories: 90, protein: 6, carbs: 16, fat: 0.4, fiber: 6, sodium: 300 },
  { aliases: ['frango'], name: 'Frango', unit: 'g', basis: 'weight', calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, sodium: 74 },
  { aliases: ['carne', 'bife', 'patinho'], name: 'Carne bovina', unit: 'g', basis: 'weight', calories: 182, protein: 26, carbs: 0, fat: 8, fiber: 0, sodium: 66 },
  { aliases: ['peixe', 'salmao', 'tilapia'], name: 'Peixe', unit: 'g', basis: 'weight', calories: 150, protein: 22, carbs: 0, fat: 6, fiber: 0, sodium: 60 },
  { aliases: ['salada', 'alface', 'legumes'], name: 'Salada', unit: 'g', basis: 'weight', calories: 20, protein: 1.5, carbs: 3.5, fat: 0.2, fiber: 1.8, sodium: 15 },
  {
    aliases: ['macarrao', 'massa', 'espaguete', 'spaghetti', 'penne'],
    name: 'Macarrão',
    unit: 'g',
    basis: 'weight',
    calories: 160,
    protein: 5,
    carbs: 30,
    fat: 1,
    fiber: 1.5,
    sodium: 3,
  },
  { aliases: ['banana', 'bananas'], name: 'Banana', unit: 'unidade', basis: 'count', calories: 90, protein: 1, carbs: 23, fat: 0, fiber: 3, sodium: 1 },
  {
    // "maca"/"macas" cobre tanto "maçã" quanto a grafia sem acento — nunca
    // casa com "macarrão" porque o limite de palavra exige a palavra inteira.
    aliases: ['maca', 'macas'],
    name: 'Maçã',
    unit: 'g',
    basis: 'weight',
    calories: 55,
    protein: 0.3,
    carbs: 14,
    fat: 0.2,
    fiber: 2,
    sodium: 1,
  },
  { aliases: ['iogurte', 'iogurtes'], name: 'Iogurte', unit: 'unidade', basis: 'count', calories: 120, protein: 10, carbs: 12, fat: 4, fiber: 0, sodium: 60 },
  { aliases: ['aveia'], name: 'Aveia', unit: 'porção', basis: 'count', calories: 110, protein: 4, carbs: 19, fat: 2, fiber: 3, sodium: 2 },
  { aliases: ['queijo', 'queijos'], name: 'Queijo', unit: 'fatia', basis: 'count', calories: 105, protein: 7, carbs: 1, fat: 8, fiber: 0, sodium: 180 },
  { aliases: ['leite'], name: 'Leite', unit: 'ml', basis: 'volume', calories: 60, protein: 3.2, carbs: 4.8, fat: 3.3, fiber: 0, sodium: 50 },
  { aliases: ['batata doce'], name: 'Batata-doce', unit: 'g', basis: 'weight', calories: 90, protein: 1.6, carbs: 21, fat: 0.1, fiber: 2.5, sodium: 30 },
  { aliases: ['batata', 'batatas'], name: 'Batata', unit: 'g', basis: 'weight', calories: 80, protein: 2, carbs: 18, fat: 0.1, fiber: 1.5, sodium: 8 },
  { aliases: ['whey', 'shake'], name: 'Whey protein', unit: 'dose', basis: 'count', calories: 130, protein: 25, carbs: 4, fat: 2, fiber: 0, sodium: 90 },
  { aliases: ['tapioca', 'tapiocas'], name: 'Tapioca', unit: 'unidade', basis: 'count', calories: 150, protein: 0, carbs: 37, fat: 0, fiber: 0, sodium: 5 },
  { aliases: ['suco'], name: 'Suco', unit: 'ml', basis: 'volume', calories: 55, protein: 0.5, carbs: 13, fat: 0, fiber: 0.2, sodium: 3 },
  { aliases: ['pizza'], name: 'Pizza', unit: 'fatia', basis: 'count', calories: 285, protein: 12, carbs: 36, fat: 10, fiber: 2, sodium: 640 },
  { aliases: ['big mac', 'bigmac'], name: 'Big Mac', unit: 'unidade', basis: 'count', calories: 503, protein: 27, carbs: 44, fat: 25, fiber: 3, sodium: 970 },
  { aliases: ['coca zero', 'refri zero', 'refrigerante zero'], name: 'Refrigerante zero', unit: 'ml', basis: 'volume', calories: 0.5, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 14 },
  { aliases: ['coca', 'refrigerante'], name: 'Refrigerante', unit: 'ml', basis: 'volume', calories: 42, protein: 0, carbs: 10.5, fat: 0, fiber: 0, sodium: 4 },
  { aliases: ['acai'], name: 'Açaí', unit: 'tigela', basis: 'count', calories: 380, protein: 4, carbs: 60, fat: 14, fiber: 6, sodium: 15 },
  { aliases: ['feijoada'], name: 'Feijoada', unit: 'porção', basis: 'count', calories: 450, protein: 28, carbs: 30, fat: 24, fiber: 9, sodium: 1100 },
]

// Falha rápido se um alias curto demais for adicionado no futuro — matches
// parciais de 1-2 letras são a fonte mais comum de falsos positivos.
for (const entry of FOOD_TABLE) {
  for (const alias of entry.aliases) {
    if (alias.replace(/\s/g, '').length < MIN_ALIAS_LENGTH) {
      throw new Error(
        `Alias "${alias}" de "${entry.name}" tem menos de ${MIN_ALIAS_LENGTH} caracteres — risco de match parcial indevido.`,
      )
    }
  }
}

/** Estimativa usada quando o alimento não está na tabela local (valor por 100g). */
const GENERIC_FOOD = {
  basis: 'weight' as const,
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

/** Alerta a UI quando a análise resulta em macros implausíveis para uma refeição simples. */
export const IMPLAUSIBLE_CALORIE_THRESHOLD = 2500

const WEIGHT_UNIT_PATTERN = /(\d+(?:[.,]\d+)?)\s*(quilos?|kg|gramas?|g)\b/i
const VOLUME_UNIT_PATTERN = /(\d+(?:[.,]\d+)?)\s*(mililitros?|ml|litros?|l)\b/i

/**
 * Separa o texto em itens: "," / "+" / " e " sempre separam; " com " separa
 * também (ex.: "arroz com feijão", "macarrão com carne" viram dois itens),
 * exceto logo após "café" — "café com leite" é um prato único, não dois.
 */
const ITEM_SPLIT_PATTERN = /,|\+|\se\s|(?<!\bcaf[eé])\scom\s/i

function toNumber(raw: string): number {
  return Number(raw.replace(',', '.'))
}

function round1(value: number): number {
  return Math.round(value * 10) / 10
}

interface ParsedAmount {
  /** Quantidade a exibir para o usuário, já na unidade correspondente. */
  quantity: number
  unit: string
  /** Multiplicador aplicado sobre os valores base (por 100g / 100ml / unidade). */
  scale: number
}

/**
 * Interpreta a quantidade textual de um item ("100 gramas", "100g", "200ml",
 * "2", "duas"…) e converte para o multiplicador correto sobre os valores
 * base do alimento — a causa raiz do bug anterior era tratar o número de
 * gramas como se fosse a contagem de porções (ex.: 100g virava 100x).
 */
function parseAmount(part: string, basis: Basis, fallbackUnit: string): ParsedAmount {
  const weightMatch = part.match(WEIGHT_UNIT_PATTERN)
  if (weightMatch) {
    const raw = toNumber(weightMatch[1])
    const isKg = /^(quilos?|kg)$/i.test(weightMatch[2])
    const grams = isKg ? raw * 1000 : raw
    return { quantity: grams, unit: 'g', scale: grams / 100 }
  }

  const volumeMatch = part.match(VOLUME_UNIT_PATTERN)
  if (volumeMatch) {
    const raw = toNumber(volumeMatch[1])
    const isLiters = /^(litros?|l)$/i.test(volumeMatch[2])
    const ml = isLiters ? raw * 1000 : raw
    return { quantity: ml, unit: 'ml', scale: ml / 100 }
  }

  const digits = part.match(/(\d+(?:[.,]\d+)?)/)
  const count = digits
    ? Math.min(toNumber(digits[1]), 20)
    : (QUANTITY_WORDS[part.trim().split(/\s+/)[0]?.toLowerCase() ?? ''] ?? 1)

  if (basis === 'count') return { quantity: round1(count), unit: fallbackUnit, scale: count }

  // Sem peso/volume explícito: assume N porções-padrão de 100 (100g ou 100ml).
  const unit = basis === 'volume' ? 'ml' : 'g'
  return { quantity: count * 100, unit, scale: count }
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

interface ParsedItem {
  item: AnalyzedFoodItem
  /** false quando nenhum alimento da tabela casou — usamos a estimativa genérica. */
  matched: boolean
}

function analyzePart(part: string): ParsedItem | null {
  const trimmed = part.trim()
  if (trimmed.length < 2) return null

  const normalized = normalize(trimmed)
  const match = FOOD_TABLE.find((entry) =>
    entry.aliases.some((alias) => matchesAlias(normalized, alias)),
  )
  const matched = Boolean(match)
  const base = match ?? { ...GENERIC_FOOD, name: `${capitalize(trimmed)}${UNMATCHED_ITEM_SUFFIX}`, unit: 'g' }

  const { quantity, unit, scale } = parseAmount(trimmed, base.basis, base.unit)

  const item: AnalyzedFoodItem = {
    name: base.name,
    quantity: round1(quantity),
    unit,
    calories: Math.round(base.calories * scale),
    protein: round1(base.protein * scale),
    carbs: round1(base.carbs * scale),
    fat: round1(base.fat * scale),
    fiber: round1(base.fiber * scale),
    sodium: Math.round(base.sodium * scale),
  }

  return { item, matched }
}

/**
 * Fallback local: divide o texto em itens e estima macros pela tabela.
 * Mesma assinatura do analisador de IA.
 */
export const analyzeMealLocally: NutritionAnalyzer = async (text) => {
  const parts = text.split(ITEM_SPLIT_PATTERN).filter((part) => part.trim().length > 0)
  const parsed = parts
    .map(analyzePart)
    .filter((parsedItem): parsedItem is ParsedItem => parsedItem !== null)

  if (parsed.length === 0) {
    throw new Error('Não consegui identificar alimentos no texto. Tente algo como "2 ovos e 1 banana".')
  }

  const items = parsed.map((parsedItem) => parsedItem.item)
  // Alimento não reconhecido nunca vira um alimento aleatório da tabela —
  // a confiança cai para sinalizar à UI que o usuário deve detalhar melhor.
  const hasUnmatchedItem = parsed.some((parsedItem) => !parsedItem.matched)

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
    confidence: hasUnmatchedItem ? LOCAL_CONFIDENCE_UNMATCHED : LOCAL_CONFIDENCE,
    sourceText: text.trim(),
    parserVersion: LOCAL_PARSER_VERSION,
    model: LOCAL_FALLBACK_MODEL,
    analyzedAt: new Date().toISOString(),
  }
  return withRecomputedTotals(base, items)
}
