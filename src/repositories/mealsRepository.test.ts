import { describe, expect, it } from 'vitest'
import { buildMealInsertPayload } from './mealsRepository'
import { analyzeMealLocally } from '../services/ai/localAnalyzer'

const USER_ID = 'user-123'

/** Percorre um valor recursivamente e retorna true se algum campo for `undefined`. */
function containsUndefined(value: unknown): boolean {
  if (value === undefined) return true
  if (value === null || typeof value !== 'object') return false
  return Object.values(value as Record<string, unknown>).some(containsUndefined)
}

describe('buildMealInsertPayload', () => {
  it('rounds decimal macros to integers for meal_logs (integer columns)', async () => {
    const analysis = await analyzeMealLocally(
      '100 gramas de arroz e 100 gramas de carne moida patinho',
    )
    // Reproduz o bug relatado: macros com casa decimal (ex.: 28.7g proteína).
    expect(Number.isInteger(analysis.protein)).toBe(false)

    const payload = buildMealInsertPayload(USER_ID, {
      mealType: 'lunch',
      analysis,
    })

    expect(Number.isInteger(payload.calories)).toBe(true)
    expect(Number.isInteger(payload.protein)).toBe(true)
    expect(Number.isInteger(payload.carbs)).toBe(true)
    expect(Number.isInteger(payload.fat)).toBe(true)
    expect(Number.isInteger(payload.fiber)).toBe(true)
    expect(Number.isInteger(payload.sodium)).toBe(true)
  })

  it('never produces negative values for the integer columns', () => {
    const payload = buildMealInsertPayload(USER_ID, {
      mealType: 'snack',
      analysis: {
        name: 'Teste',
        description: 'teste',
        items: [],
        calories: -5,
        protein: Number.NaN,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sodium: 0,
      },
    })

    expect(payload.calories).toBeGreaterThanOrEqual(0)
    expect(payload.protein).toBeGreaterThanOrEqual(0)
  })

  it('produces a payload with no undefined fields for a two-item local analysis', async () => {
    const analysis = await analyzeMealLocally(
      '100 gramas de arroz e 100 gramas de carne moida patinho',
    )
    const payload = buildMealInsertPayload(USER_ID, { mealType: 'lunch', analysis })

    expect(containsUndefined(payload)).toBe(false)
  })

  it('is JSON-serializable (safe to send as the Supabase insert body)', async () => {
    const analysis = await analyzeMealLocally('2 ovos')
    const payload = buildMealInsertPayload(USER_ID, { mealType: 'breakfast', analysis })

    expect(() => JSON.stringify(payload)).not.toThrow()
    const roundTripped = JSON.parse(JSON.stringify(payload))
    expect(roundTripped.calories).toBe(payload.calories)
    expect(roundTripped.analysis_json.items).toHaveLength(analysis.items.length)
  })

  it('accepts the acceptance-criteria input end to end', async () => {
    const analysis = await analyzeMealLocally(
      '100 gramas de arroz e 100 gramas de carne moida patinho',
    )
    const payload = buildMealInsertPayload(USER_ID, { mealType: 'lunch', analysis })

    expect(payload.user_id).toBe(USER_ID)
    expect(payload.meal_type).toBe('lunch')
    expect(payload.calories).toBeGreaterThanOrEqual(250)
    expect(payload.calories).toBeLessThanOrEqual(450)
  })
})
