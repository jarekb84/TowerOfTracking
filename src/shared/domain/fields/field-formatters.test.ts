import { describe, it, expect } from 'vitest'
import { formatFieldDisplayName, getFieldFormatter } from './field-formatters'

describe('formatFieldDisplayName', () => {
  it('should format camelCase field names', () => {
    expect(formatFieldDisplayName('coinsEarned')).toBe('Coins Earned')
    expect(formatFieldDisplayName('cellsEarned')).toBe('Cells Earned')
    expect(formatFieldDisplayName('realTime')).toBe('Real Time')
  })

  it('should format snake_case field names', () => {
    expect(formatFieldDisplayName('damage_dealt')).toBe('Damage Dealt')
    expect(formatFieldDisplayName('enemies_defeated')).toBe('Enemies Defeated')
    expect(formatFieldDisplayName('wave_duration')).toBe('Wave Duration')
  })

  it('should format single word field names', () => {
    expect(formatFieldDisplayName('tier')).toBe('Tier')
    expect(formatFieldDisplayName('wave')).toBe('Wave')
  })

  it('should handle mixed formats', () => {
    expect(formatFieldDisplayName('damageDealt_total')).toBe('Damage Dealt Total')
    expect(formatFieldDisplayName('totalDamage_dealt')).toBe('Total Damage Dealt')
  })

  it('should handle already capitalized names', () => {
    expect(formatFieldDisplayName('Tier')).toBe('Tier')
    expect(formatFieldDisplayName('DamageDealt')).toBe('Damage Dealt')
  })

  it('should trim whitespace', () => {
    expect(formatFieldDisplayName('  coinsEarned  ')).toBe('Coins Earned')
  })
})

describe('getFieldFormatter', () => {
  it('should return formatDuration for duration dataType', () => {
    const formatter = getFieldFormatter('waveDuration', 'duration')
    const result = formatter(3661) // 1 hour 1 minute 1 second
    expect(result).toContain('1h')
    expect(result).toContain('1m')
    expect(result).toContain('1s')
  })

  it('should return formatDuration for realTime field', () => {
    const formatter = getFieldFormatter('realTime', 'number')
    const result = formatter(7200) // 2 hours
    expect(result).toContain('2h')
  })

  it('should return formatLargeNumber for coin fields', () => {
    const formatter = getFieldFormatter('coinsEarned', 'number')
    const result = formatter(50000)
    expect(result).toBe('50K')
  })

  it('should return formatLargeNumber for cell fields', () => {
    const formatter = getFieldFormatter('cellsEarned', 'number')
    const result = formatter(1000000)
    expect(result).toBe('1M')
  })

  it('should return formatLargeNumber for all numeric fields', () => {
    const formatter = getFieldFormatter('damageDealt', 'number')
    const result = formatter(1234567)
    expect(result).toBe('1.23M')
  })

  it('should return formatLargeNumber for tier field', () => {
    const formatter = getFieldFormatter('tier', 'number')
    const result = formatter(15)
    expect(result).toBe('15')
  })

  it('should return formatLargeNumber for wave field', () => {
    const formatter = getFieldFormatter('wave', 'number')
    const result = formatter(1000)
    expect(result).toBe('1K')
  })

  it('should return formatLargeNumber for large damage values', () => {
    const formatter = getFieldFormatter('damageDealt', 'number')
    const result = formatter(31083533633462460000000000000000)
    expect(result).toBe('31.08N')
  })
})
