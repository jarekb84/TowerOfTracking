import { describe, it, expect } from 'vitest'
import { filterFieldOptions } from './field-selector-logic'
import type { FieldOption } from './field-selector'

describe('filterFieldOptions', () => {
  const sampleFields: FieldOption[] = [
    { value: 'tier', label: 'Tier', dataType: 'number' },
    { value: 'wave', label: 'Wave', dataType: 'number' },
    { value: 'coinsEarned', label: 'Coins Earned', dataType: 'number' },
    { value: 'cellsEarned', label: 'Cells Earned', dataType: 'number' },
    { value: 'realTime', label: 'Real Time', dataType: 'duration' },
    { value: 'damageDealt', label: 'Damage Dealt', dataType: 'number' },
    { value: 'damageTaken', label: 'Damage Taken', dataType: 'number' },
    { value: 'enemiesDefeated', label: 'Enemies Defeated', dataType: 'number' },
  ]

  it('should return all fields when search term is empty', () => {
    const result = filterFieldOptions(sampleFields, '')
    expect(result).toHaveLength(sampleFields.length)
    expect(result).toEqual(sampleFields)
  })

  it('should return all fields when search term is only whitespace', () => {
    const result = filterFieldOptions(sampleFields, '   ')
    expect(result).toHaveLength(sampleFields.length)
  })

  it('should filter by label - case insensitive', () => {
    const result = filterFieldOptions(sampleFields, 'damage')
    expect(result).toHaveLength(2)
    expect(result).toContainEqual(sampleFields.find(f => f.value === 'damageDealt'))
    expect(result).toContainEqual(sampleFields.find(f => f.value === 'damageTaken'))
  })

  it('should filter by label - uppercase search', () => {
    const result = filterFieldOptions(sampleFields, 'DAMAGE')
    expect(result).toHaveLength(2)
  })

  it('should filter by value (field key)', () => {
    const result = filterFieldOptions(sampleFields, 'coins')
    expect(result).toHaveLength(1)
    expect(result[0].value).toBe('coinsEarned')
  })

  it('should filter by partial label match', () => {
    const result = filterFieldOptions(sampleFields, 'Ear')
    expect(result).toHaveLength(2)
    expect(result).toContainEqual(sampleFields.find(f => f.value === 'coinsEarned'))
    expect(result).toContainEqual(sampleFields.find(f => f.value === 'cellsEarned'))
  })

  it('should filter by partial value match', () => {
    const result = filterFieldOptions(sampleFields, 'real')
    expect(result).toHaveLength(1)
    expect(result[0].value).toBe('realTime')
  })

  it('should return empty array when no matches', () => {
    const result = filterFieldOptions(sampleFields, 'nonexistent')
    expect(result).toHaveLength(0)
  })

  it('should match "time" to "Real Time"', () => {
    const result = filterFieldOptions(sampleFields, 'time')
    expect(result).toHaveLength(1)
    expect(result[0].value).toBe('realTime')
  })

  it('should match single letter', () => {
    const result = filterFieldOptions(sampleFields, 't')
    expect(result.length).toBeGreaterThan(0)
    // Should match Tier, Real Time, Damage Dealt, Damage Taken, Enemies Defeated
    expect(result.some(f => f.value === 'tier')).toBe(true)
  })

  it('should trim whitespace from search term', () => {
    const result1 = filterFieldOptions(sampleFields, '  damage  ')
    const result2 = filterFieldOptions(sampleFields, 'damage')
    expect(result1).toEqual(result2)
  })

  it('should handle special characters in search term', () => {
    const fieldsWithSpecial: FieldOption[] = [
      { value: 'dmg_dealt', label: 'DMG/Dealt', dataType: 'number' },
      { value: 'coins_earned', label: 'Coins (Earned)', dataType: 'number' },
    ]
    const result = filterFieldOptions(fieldsWithSpecial, '/')
    expect(result).toHaveLength(1)
    expect(result[0].value).toBe('dmg_dealt')
  })

  it('should match across word boundaries', () => {
    const result = filterFieldOptions(sampleFields, 'defe')
    expect(result).toHaveLength(1)
    expect(result[0].value).toBe('enemiesDefeated')
  })
})
