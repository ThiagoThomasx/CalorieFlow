import { describe, expect, it } from 'vitest'
import { OBJECTIVE_PRESETS } from './constants'

describe('OBJECTIVE_PRESETS', () => {
  it('has a preset for every objective', () => {
    expect(Object.keys(OBJECTIVE_PRESETS).sort()).toEqual(
      ['gain_muscle', 'lose_fat', 'maintain'].sort(),
    )
  })

  it('suggests a calorie deficit for lose_fat relative to maintain', () => {
    expect(OBJECTIVE_PRESETS.lose_fat.caloriesGoal).toBeLessThan(
      OBJECTIVE_PRESETS.maintain.caloriesGoal,
    )
  })

  it('suggests a calorie surplus for gain_muscle relative to maintain', () => {
    expect(OBJECTIVE_PRESETS.gain_muscle.caloriesGoal).toBeGreaterThan(
      OBJECTIVE_PRESETS.maintain.caloriesGoal,
    )
  })

  it('every preset has positive, finite values', () => {
    for (const preset of Object.values(OBJECTIVE_PRESETS)) {
      expect(preset.caloriesGoal).toBeGreaterThan(0)
      expect(preset.proteinGoal).toBeGreaterThan(0)
      expect(preset.waterGoalMl).toBeGreaterThan(0)
    }
  })
})
