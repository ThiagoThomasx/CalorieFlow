/**
 * Prompt e schema de saída da análise nutricional.
 *
 * Mantido enxuto de propósito: prompts curtos = respostas mais rápidas
 * e mais baratas. O JSON Schema (structured outputs) garante o formato,
 * então o prompt foca apenas nas regras de interpretação.
 */

export const SYSTEM_PROMPT = `Você é um nutricionista especializado em estimar valores nutricionais a partir de descrições livres de refeições.

Regras de interpretação:
- Aceite português, inglês ou os dois misturados ("2 eggs e um pão").
- Reconheça quantidades por extenso ("dois ovos", "meio pão", "uma banana") e medidas caseiras ("3 colheres de arroz", "um prato de macarrão", "uma fatia").
- Quando a quantidade não for informada, assuma 1 porção típica brasileira.
- Priorize alimentos e porções brasileiras (referência: tabela TACO). Para industrializados e fast food ("Big Mac", "Coca Zero"), use os valores oficiais do produto.
- Quando não souber o valor exato, ESTIME com bom senso a partir de alimentos semelhantes. Nunca invente alimentos absurdos nem retorne zero por preguiça.
- Ignore trechos que não sejam comida ou bebida.
- Preencha micros apenas com micronutrientes que você conhece com razoável certeza (ex.: potássio, cálcio, ferro, vitamina C). Poucos e confiáveis é melhor que muitos e inventados.

Regras dos números:
- Valores de cada item já multiplicados pela quantidade (2 ovos = calorias de 2 ovos).
- calories em kcal; protein/carbs/fat/fiber em gramas; sodium em miligramas. Inteiros ou uma casa decimal.
- totals = soma exata dos itens.
- As calorias devem ser coerentes com os macros (≈ 4×proteína + 4×carboidrato + 9×gordura).
- confidence entre 0 e 1: sua confiança geral na estimativa (descrições vagas = confiança menor).`

/** Monta a mensagem do usuário isolando o texto livre. */
export function buildUserMessage(text: string): string {
  return `Analise a seguinte refeição e retorne o JSON estruturado:\n\n"""${text}"""`
}

/**
 * JSON Schema para structured outputs (output_config.format).
 * Compatível com as restrições da API: additionalProperties: false,
 * todos os campos required, sem constraints numéricas.
 */
export const ANALYSIS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['items', 'totals', 'confidence'],
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: [
          'name',
          'quantity',
          'unit',
          'calories',
          'protein',
          'carbs',
          'fat',
          'fiber',
          'sodium',
          'micros',
        ],
        properties: {
          name: { type: 'string', description: 'Nome do alimento em pt-BR, capitalizado' },
          quantity: { type: 'number', description: 'Quantidade interpretada (ex.: 2, 0.5, 100)' },
          unit: {
            type: 'string',
            description: 'Unidade da quantidade: "unidade", "g", "ml", "fatia", "colher", "prato", "porção"…',
          },
          calories: { type: 'number', description: 'kcal totais do item (já multiplicado pela quantidade)' },
          protein: { type: 'number', description: 'Proteína em g' },
          carbs: { type: 'number', description: 'Carboidratos em g' },
          fat: { type: 'number', description: 'Gorduras em g' },
          fiber: { type: 'number', description: 'Fibra em g' },
          sodium: { type: 'number', description: 'Sódio em mg' },
          micros: {
            type: 'array',
            description: 'Micronutrientes conhecidos com confiança (pode ser vazio)',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['name', 'amount', 'unit'],
              properties: {
                name: { type: 'string', description: 'Ex.: "Potássio", "Vitamina C"' },
                amount: { type: 'number' },
                unit: { type: 'string', description: 'Ex.: "mg", "mcg"' },
              },
            },
          },
        },
      },
    },
    totals: {
      type: 'object',
      additionalProperties: false,
      required: ['calories', 'protein', 'carbs', 'fat', 'fiber', 'sodium'],
      properties: {
        calories: { type: 'number' },
        protein: { type: 'number' },
        carbs: { type: 'number' },
        fat: { type: 'number' },
        fiber: { type: 'number' },
        sodium: { type: 'number' },
      },
    },
    confidence: { type: 'number', description: 'Confiança geral entre 0 e 1' },
  },
} as const
