import { describe, expect, it } from 'vitest'
import { analyzeMealLocally, UNMATCHED_ITEM_SUFFIX } from './localAnalyzer'

describe('analyzeMealLocally', () => {
  it('estimates 100g arroz between 100 and 180 kcal', async () => {
    const result = await analyzeMealLocally('100g arroz')
    expect(result.calories).toBeGreaterThanOrEqual(100)
    expect(result.calories).toBeLessThanOrEqual(180)
  })

  it('estimates "100 gramas de arroz" between 100 and 180 kcal', async () => {
    const result = await analyzeMealLocally('100 gramas de arroz')
    expect(result.calories).toBeGreaterThanOrEqual(100)
    expect(result.calories).toBeLessThanOrEqual(180)
  })

  it('estimates 100g patinho between 130 and 250 kcal', async () => {
    const result = await analyzeMealLocally('100g patinho')
    expect(result.calories).toBeGreaterThanOrEqual(130)
    expect(result.calories).toBeLessThanOrEqual(250)
  })

  it('estimates "100 gramas de carne moida patinho" between 130 and 250 kcal', async () => {
    const result = await analyzeMealLocally('100 gramas de carne moida patinho')
    expect(result.calories).toBeGreaterThanOrEqual(130)
    expect(result.calories).toBeLessThanOrEqual(250)
  })

  it('estimates arroz + patinho (100g each) between 250 and 450 kcal', async () => {
    const result = await analyzeMealLocally(
      '100 gramas de arroz e 100 gramas de carne moida patinho',
    )
    expect(result.calories).toBeGreaterThanOrEqual(250)
    expect(result.calories).toBeLessThanOrEqual(450)
    expect(result.items).toHaveLength(2)
  })

  it('estimates 2 ovos as a reasonable value (not absurd)', async () => {
    const result = await analyzeMealLocally('2 ovos')
    expect(result.calories).toBeGreaterThan(0)
    expect(result.calories).toBeLessThan(300)
  })

  it('estimates 1 pão francês as a reasonable value', async () => {
    const result = await analyzeMealLocally('1 pão francês')
    expect(result.calories).toBeGreaterThan(0)
    expect(result.calories).toBeLessThan(300)
  })

  it('estimates 1 banana as a reasonable value', async () => {
    const result = await analyzeMealLocally('1 banana')
    expect(result.calories).toBeGreaterThan(0)
    expect(result.calories).toBeLessThan(200)
  })

  it('estimates 200ml coca zero below 10 kcal', async () => {
    const result = await analyzeMealLocally('200ml coca zero')
    expect(result.calories).toBeLessThan(10)
  })

  it('never produces absurd totals for simple combined meals', async () => {
    const result = await analyzeMealLocally(
      '100 gramas de arroz e 100 gramas de carne moida patinho',
    )
    expect(result.calories).toBeLessThan(1000)
    expect(result.protein).toBeLessThan(100)
    expect(result.carbs).toBeLessThan(100)
    expect(result.fat).toBeLessThan(100)
  })

  describe('macarrão vs maçã matching (regression)', () => {
    it('"1kg de macarrão" resolves to Macarrão, never Maçã', async () => {
      const result = await analyzeMealLocally('1kg de macarrão')
      expect(result.items).toHaveLength(1)
      expect(result.items[0]?.name).toBe('Macarrão')
      expect(result.items[0]?.name).not.toBe('Maçã')
    })

    it('"100g de macarrão" estimates between 140 and 190 kcal', async () => {
      const result = await analyzeMealLocally('100g de macarrão')
      expect(result.calories).toBeGreaterThanOrEqual(140)
      expect(result.calories).toBeLessThanOrEqual(190)
    })

    it('"100g de macarrao" (sem acento) also resolves to Macarrão', async () => {
      const result = await analyzeMealLocally('100g de macarrao')
      expect(result.items[0]?.name).toBe('Macarrão')
      expect(result.calories).toBeGreaterThanOrEqual(140)
      expect(result.calories).toBeLessThanOrEqual(190)
    })

    it('"100g de maçã" estimates between 45 and 70 kcal', async () => {
      const result = await analyzeMealLocally('100g de maçã')
      expect(result.items[0]?.name).toBe('Maçã')
      expect(result.calories).toBeGreaterThanOrEqual(45)
      expect(result.calories).toBeLessThanOrEqual(70)
    })

    it('"100g de maca" (sem acento) also resolves to Maçã', async () => {
      const result = await analyzeMealLocally('100g de maca')
      expect(result.items[0]?.name).toBe('Maçã')
    })

    it('"massa" resolves to Macarrão', async () => {
      const result = await analyzeMealLocally('100g de massa')
      expect(result.items[0]?.name).toBe('Macarrão')
    })

    it('"macarrão com carne" returns two items', async () => {
      const result = await analyzeMealLocally('macarrão com carne')
      expect(result.items).toHaveLength(2)
      const names = result.items.map((item) => item.name)
      expect(names).toContain('Macarrão')
      expect(names).toContain('Carne bovina')
    })

    it('never matches "macarrao" as a substring of the "maca" alias', async () => {
      // Regressão direta do bug: /ma[çc][ãa]/i casava com o prefixo "maca"
      // de "macarrão" por falta de limite de palavra.
      const result = await analyzeMealLocally('macarrão')
      expect(result.items.every((item) => item.name !== 'Maçã')).toBe(true)
    })

    it('an unrecognized food never silently becomes Maçã', async () => {
      const result = await analyzeMealLocally('100g de xyzalimentoinventado')
      expect(result.items[0]?.name).not.toBe('Maçã')
      expect(result.items[0]?.name).toContain(UNMATCHED_ITEM_SUFFIX)
      // confiança deve cair quando o item não foi reconhecido
      expect(result.confidence ?? 1).toBeLessThan(0.3)
    })
  })
})
