import { describe, expect, it } from 'vitest'
import { analyzeMealLocally } from './localAnalyzer'

/**
 * Casos que historicamente geram falsos positivos por matching parcial ou
 * substrings ambíguas — garante que palavras parecidas não se confundam.
 */
describe('localAnalyzer alias disambiguation', () => {
  it('does not let "arroz" swallow "carne" when joined by "com"', async () => {
    const result = await analyzeMealLocally('arroz com feijão')
    const names = result.items.map((item) => item.name)
    expect(names).toContain('Arroz')
    expect(names).toContain('Feijão')
  })

  it('keeps "café com leite" as a single combined item', async () => {
    const result = await analyzeMealLocally('café com leite')
    expect(result.items).toHaveLength(1)
    expect(result.items[0]?.name).toBe('Café com leite')
  })

  it('does not match "pão" inside unrelated words lacking a word boundary', async () => {
    const result = await analyzeMealLocally('100g de espaguete')
    expect(result.items[0]?.name).toBe('Macarrão')
  })
})
