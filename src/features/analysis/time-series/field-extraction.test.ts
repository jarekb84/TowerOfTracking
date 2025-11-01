import { describe, it, expect } from 'vitest'
import { extractFieldValue } from './field-extraction'
import type { ParsedGameRun } from '@/shared/types/game-run.types'

describe('extractFieldValue', () => {
  it('should extract cached numeric property - tier', () => {
    const run: ParsedGameRun = {
      id: '1',
      timestamp: new Date('2025-01-15'),
      tier: 15,
      wave: 1000,
      coinsEarned: 50000,
      cellsEarned: 1000,
      realTime: 3600,
      runType: 'farm',
      fields: {}
    }

    expect(extractFieldValue(run, 'tier')).toBe(15)
  })

  it('should extract cached numeric property - wave', () => {
    const run: ParsedGameRun = {
      id: '1',
      timestamp: new Date('2025-01-15'),
      tier: 10,
      wave: 1250,
      coinsEarned: 50000,
      cellsEarned: 1000,
      realTime: 3600,
      runType: 'farm',
      fields: {}
    }

    expect(extractFieldValue(run, 'wave')).toBe(1250)
  })

  it('should extract cached numeric property - coinsEarned', () => {
    const run: ParsedGameRun = {
      id: '1',
      timestamp: new Date('2025-01-15'),
      tier: 10,
      wave: 1000,
      coinsEarned: 75000,
      cellsEarned: 1000,
      realTime: 3600,
      runType: 'farm',
      fields: {}
    }

    expect(extractFieldValue(run, 'coinsEarned')).toBe(75000)
  })

  it('should extract cached numeric property - cellsEarned', () => {
    const run: ParsedGameRun = {
      id: '1',
      timestamp: new Date('2025-01-15'),
      tier: 10,
      wave: 1000,
      coinsEarned: 50000,
      cellsEarned: 1500,
      realTime: 3600,
      runType: 'farm',
      fields: {}
    }

    expect(extractFieldValue(run, 'cellsEarned')).toBe(1500)
  })

  it('should extract cached numeric property - realTime', () => {
    const run: ParsedGameRun = {
      id: '1',
      timestamp: new Date('2025-01-15'),
      tier: 10,
      wave: 1000,
      coinsEarned: 50000,
      cellsEarned: 1000,
      realTime: 7200,
      runType: 'farm',
      fields: {}
    }

    expect(extractFieldValue(run, 'realTime')).toBe(7200)
  })

  it('should extract dynamic field with number dataType', () => {
    const run: ParsedGameRun = {
      id: '1',
      timestamp: new Date('2025-01-15'),
      tier: 10,
      wave: 1000,
      coinsEarned: 50000,
      cellsEarned: 1000,
      realTime: 3600,
      runType: 'farm',
      fields: {
        damageDealt: {
          value: 125000,
          rawValue: '125K',
          displayValue: '125.00K',
          originalKey: 'Damage Dealt',
          dataType: 'number'
        }
      }
    }

    expect(extractFieldValue(run, 'damageDealt')).toBe(125000)
  })

  it('should extract dynamic field with duration dataType', () => {
    const run: ParsedGameRun = {
      id: '1',
      timestamp: new Date('2025-01-15'),
      tier: 10,
      wave: 1000,
      coinsEarned: 50000,
      cellsEarned: 1000,
      realTime: 3600,
      runType: 'farm',
      fields: {
        waveDuration: {
          value: 180,
          rawValue: '3m',
          displayValue: '3m 0s',
          originalKey: 'Wave Duration',
          dataType: 'duration'
        }
      }
    }

    expect(extractFieldValue(run, 'waveDuration')).toBe(180)
  })

  it('should return undefined for non-existent field', () => {
    const run: ParsedGameRun = {
      id: '1',
      timestamp: new Date('2025-01-15'),
      tier: 10,
      wave: 1000,
      coinsEarned: 50000,
      cellsEarned: 1000,
      realTime: 3600,
      runType: 'farm',
      fields: {}
    }

    expect(extractFieldValue(run, 'nonExistentField')).toBeUndefined()
  })

  it('should return undefined for string field', () => {
    const run: ParsedGameRun = {
      id: '1',
      timestamp: new Date('2025-01-15'),
      tier: 10,
      wave: 1000,
      coinsEarned: 50000,
      cellsEarned: 1000,
      realTime: 3600,
      runType: 'farm',
      fields: {
        notes: {
          value: 'Test notes',
          rawValue: 'Test notes',
          displayValue: 'Test notes',
          originalKey: 'Notes',
          dataType: 'string'
        }
      }
    }

    expect(extractFieldValue(run, 'notes')).toBeUndefined()
  })

  it('should return undefined for date field', () => {
    const run: ParsedGameRun = {
      id: '1',
      timestamp: new Date('2025-01-15'),
      tier: 10,
      wave: 1000,
      coinsEarned: 50000,
      cellsEarned: 1000,
      realTime: 3600,
      runType: 'farm',
      fields: {
        battleDate: {
          value: new Date('2025-01-15'),
          rawValue: '2025-01-15',
          displayValue: '2025-01-15',
          originalKey: 'Battle Date',
          dataType: 'date'
        }
      }
    }

    expect(extractFieldValue(run, 'battleDate')).toBeUndefined()
  })

  it('should parse string number value from dynamic field', () => {
    const run: ParsedGameRun = {
      id: '1',
      timestamp: new Date('2025-01-15'),
      tier: 10,
      wave: 1000,
      coinsEarned: 50000,
      cellsEarned: 1000,
      realTime: 3600,
      runType: 'farm',
      fields: {
        customMetric: {
          value: '999.5',
          rawValue: '999.5',
          displayValue: '999.5',
          originalKey: 'Custom Metric',
          dataType: 'number'
        }
      }
    }

    expect(extractFieldValue(run, 'customMetric')).toBe(999.5)
  })

  it('should prioritize cached property over dynamic field with same name', () => {
    const run: ParsedGameRun = {
      id: '1',
      timestamp: new Date('2025-01-15'),
      tier: 15,
      wave: 1000,
      coinsEarned: 50000,
      cellsEarned: 1000,
      realTime: 3600,
      runType: 'farm',
      fields: {
        tier: {
          value: 99, // Should not use this value
          rawValue: '99',
          displayValue: '99',
          originalKey: 'Tier',
          dataType: 'number'
        }
      }
    }

    // Should return cached property value (15), not dynamic field value (99)
    expect(extractFieldValue(run, 'tier')).toBe(15)
  })

  it('should return undefined for duration field with non-number value', () => {
    const run: ParsedGameRun = {
      id: '1',
      timestamp: new Date('2025-01-15'),
      tier: 10,
      wave: 1000,
      coinsEarned: 50000,
      cellsEarned: 1000,
      realTime: 3600,
      runType: 'farm',
      fields: {
        invalidDuration: {
          value: 'not a number',
          rawValue: 'not a number',
          displayValue: 'not a number',
          originalKey: 'Invalid Duration',
          dataType: 'duration'
        }
      }
    }

    expect(extractFieldValue(run, 'invalidDuration')).toBeUndefined()
  })
})
