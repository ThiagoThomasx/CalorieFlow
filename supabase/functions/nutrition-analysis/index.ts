/**
 * Edge Function: nutrition-analysis
 *
 * Frontend → (JWT) → esta função → LLM → JSON validado → frontend.
 * A API key do provedor de IA vive apenas aqui (secret do Supabase);
 * o navegador nunca a vê.
 *
 * Deploy:  supabase functions deploy nutrition-analysis
 * Secrets: supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
 * Modelo:  supabase secrets set NUTRITION_MODEL=claude-haiku-4-5 (opcional)
 */
import Anthropic from 'npm:@anthropic-ai/sdk'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { ANALYSIS_SCHEMA, SYSTEM_PROMPT, buildUserMessage } from './prompt.ts'
import { extractJson, toAnalysisResponse } from './parser.ts'
import { validateAnalysis, validateRequestText } from './validator.ts'
import { PARSER_VERSION } from './types.ts'

const DEFAULT_MODEL = 'claude-opus-4-8'
const MAX_OUTPUT_TOKENS = 2048
const REQUEST_TIMEOUT_MS = 45_000

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const FRIENDLY_ERRORS = {
  unauthorized: 'Sessão inválida. Entre novamente para analisar refeições.',
  notConfigured: 'O serviço de IA ainda não foi configurado. Avise o administrador.',
  unparseable: 'Não consegui interpretar essa refeição. Tente descrever de outra forma, ex.: "2 ovos e 100g de arroz".',
  rateLimited: 'Muitas análises em sequência. Aguarde alguns segundos e tente de novo.',
  upstream: 'O serviço de IA está instável no momento. Tente novamente em instantes.',
  generic: 'Não foi possível analisar a refeição agora. Tente novamente.',
} as const

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

function errorResponse(message: string, status: number): Response {
  return jsonResponse({ error: message }, status)
}

/** Log estruturado sem dados sensíveis (nunca inclui o texto da refeição). */
function logEvent(payload: Record<string, unknown>): void {
  console.log(JSON.stringify({ fn: 'nutrition-analysis', ...payload }))
}

async function authenticate(req: Request): Promise<string | null> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return null

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } },
  )
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return null
  return data.user.id
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }
  if (req.method !== 'POST') {
    return errorResponse('Método não suportado.', 405)
  }

  const userId = await authenticate(req)
  if (!userId) {
    logEvent({ event: 'auth_failed' })
    return errorResponse(FRIENDLY_ERRORS.unauthorized, 401)
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return errorResponse('Corpo da requisição inválido.', 400)
  }

  const textResult = validateRequestText((body as { text?: unknown })?.text)
  if (!textResult.ok) {
    return errorResponse(textResult.reason, 400)
  }

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) {
    logEvent({ event: 'missing_api_key' })
    return errorResponse(FRIENDLY_ERRORS.notConfigured, 500)
  }

  const model = Deno.env.get('NUTRITION_MODEL') ?? DEFAULT_MODEL
  const anthropic = new Anthropic({
    apiKey,
    timeout: REQUEST_TIMEOUT_MS,
    maxRetries: 1,
  })

  const startedAt = Date.now()
  try {
    const message = await anthropic.messages.create({
      model,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: SYSTEM_PROMPT,
      // Extração direta: sem thinking, esforço médio = resposta rápida.
      output_config: {
        effort: 'medium',
        format: {
          type: 'json_schema',
          schema: ANALYSIS_SCHEMA,
        },
      },
      messages: [{ role: 'user', content: buildUserMessage(textResult.value) }],
    })

    const durationMs = Date.now() - startedAt

    if (message.stop_reason === 'refusal') {
      logEvent({ event: 'refusal', durationMs, model })
      return errorResponse(FRIENDLY_ERRORS.unparseable, 422)
    }
    if (message.stop_reason === 'max_tokens') {
      logEvent({ event: 'truncated', durationMs, model })
      return errorResponse(FRIENDLY_ERRORS.unparseable, 422)
    }

    const textBlock = message.content.find((block) => block.type === 'text')
    const parsed = textBlock ? extractJson(textBlock.text) : null
    if (parsed === null) {
      logEvent({ event: 'parse_failed', durationMs, model })
      return errorResponse(FRIENDLY_ERRORS.unparseable, 422)
    }

    const validation = validateAnalysis(parsed)
    if (!validation.ok) {
      logEvent({ event: 'validation_failed', reason: validation.reason, durationMs, model })
      return errorResponse(FRIENDLY_ERRORS.unparseable, 422)
    }
    if (validation.warnings.length > 0) {
      logEvent({ event: 'validation_warnings', warnings: validation.warnings, durationMs, model })
    }

    const response = toAnalysisResponse(validation.value, {
      model,
      parserVersion: PARSER_VERSION,
      durationMs,
      inputTokens: message.usage?.input_tokens ?? null,
      outputTokens: message.usage?.output_tokens ?? null,
    })

    logEvent({
      event: 'success',
      durationMs,
      model,
      textLength: textResult.value.length,
      itemCount: response.items.length,
      confidence: response.confidence,
      inputTokens: response.meta.inputTokens,
      outputTokens: response.meta.outputTokens,
    })

    return jsonResponse(response, 200)
  } catch (error) {
    const durationMs = Date.now() - startedAt

    if (error instanceof Anthropic.RateLimitError) {
      logEvent({ event: 'rate_limited', durationMs, model })
      return errorResponse(FRIENDLY_ERRORS.rateLimited, 429)
    }
    if (error instanceof Anthropic.APIConnectionError) {
      logEvent({ event: 'upstream_connection_error', durationMs, model })
      return errorResponse(FRIENDLY_ERRORS.upstream, 503)
    }
    if (error instanceof Anthropic.APIError) {
      logEvent({ event: 'upstream_api_error', status: error.status, durationMs, model })
      const status = typeof error.status === 'number' && error.status >= 500 ? 503 : 500
      return errorResponse(FRIENDLY_ERRORS.upstream, status)
    }

    logEvent({
      event: 'unexpected_error',
      durationMs,
      model,
      message: error instanceof Error ? error.message : String(error),
    })
    return errorResponse(FRIENDLY_ERRORS.generic, 500)
  }
})
