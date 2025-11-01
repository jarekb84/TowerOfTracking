import { describe, it, expect } from 'vitest'
import type { ParsedGameRun } from '@/shared/types/game-run.types'
import type { AvailableField, TierStatsColumnConfig } from '../types'
import {
  DEFAULT_COLUMNS,
  getDefaultConfig,
  discoverAvailableFields,
  getUnselectedFields,
  validateColumnConfig,
  isNumericField,
  getFieldDisplayName,
  getColumnDisplayName
} from './tier-stats-config-utils'
import { createGameRunField } from '@/features/analysis/shared/parsing/field-utils'

describe('tier-stats-config', () => {
  const createMockRun = (overrides?: Partial<ParsedGameRun>): ParsedGameRun => ({
    id: '1',
    timestamp: new Date('2024-01-01'),
    fields: {
      tier: createGameRunField('Tier', '5'),
      wave: createGameRunField('Wave', '1000'),
      realTime: createGameRunField('Real Time', '2h 30m 0s'),
      coinsEarned: createGameRunField('Coins Earned', '100M'),
      cellsEarned: createGameRunField('Cells Earned', '50K'),
      shards: createGameRunField('Shards', '1000'),
      runType: createGameRunField('Run Type', 'farm')
    },
    tier: 5,
    wave: 1000,
    coinsEarned: 100000000,
    cellsEarned: 50000,
    realTime: 9000,
    runType: 'farm',
    ...overrides
  })

  describe('getDefaultConfig', () => {
    it('should return default configuration with expected columns', () => {
      const config = getDefaultConfig()

      expect(config.selectedColumns).toEqual(DEFAULT_COLUMNS)
      expect(config.configSectionCollapsed).toBe(true)
      expect(config.lastUpdated).toBeGreaterThan(0)
    })

    it('should include wave, realTime, coinsEarned, and cellsEarned in defaults', () => {
      const config = getDefaultConfig()
      const fieldNames = config.selectedColumns.map(col => col.fieldName)

      expect(fieldNames).toContain('wave')
      expect(fieldNames).toContain('realTime')
      expect(fieldNames).toContain('coinsEarned')
      expect(fieldNames).toContain('cellsEarned')
    })
  })

  describe('discoverAvailableFields', () => {
    it('should return empty array for empty runs', () => {
      const fields = discoverAvailableFields([])
      expect(fields).toEqual([])
    })

    it('should discover all non-internal numeric fields from runs', () => {
      const runs = [createMockRun()]
      const fields = discoverAvailableFields(runs)

      const fieldNames = fields.map(f => f.fieldName)
      expect(fieldNames).toContain('wave')
      expect(fieldNames).toContain('realTime')
      expect(fieldNames).toContain('coinsEarned')
      expect(fieldNames).toContain('cellsEarned')
      expect(fieldNames).toContain('shards')
    })

    it('should exclude internal fields starting with underscore', () => {
      const run = createMockRun()
      run.fields._internalField = createGameRunField('_Internal', 'test')

      const fields = discoverAvailableFields([run])
      const fieldNames = fields.map(f => f.fieldName)

      expect(fieldNames).not.toContain('_internalField')
    })

    it('should exclude tier field (used as row grouping)', () => {
      const runs = [createMockRun()]
      const fields = discoverAvailableFields(runs)
      const fieldNames = fields.map(f => f.fieldName)

      expect(fieldNames).not.toContain('tier')
    })

    it('should exclude date fields', () => {
      const run = createMockRun()
      run.fields.battleDate = createGameRunField('Battle Date', '2024-01-01')

      const fields = discoverAvailableFields([run])
      const fieldNames = fields.map(f => f.fieldName)

      expect(fieldNames).not.toContain('battleDate')
    })

    it('should exclude runType field', () => {
      const runs = [createMockRun()]
      const fields = discoverAvailableFields(runs)
      const fieldNames = fields.map(f => f.fieldName)

      expect(fieldNames).not.toContain('runType')
    })

    it('should exclude string-only fields (not aggregatable)', () => {
      const run = createMockRun()
      run.fields.killedBy = createGameRunField('Killed By', 'Boss')

      const fields = discoverAvailableFields([run])
      const fieldNames = fields.map(f => f.fieldName)

      expect(fieldNames).not.toContain('killedBy')
    })

    it('should mark numeric and duration fields as isNumeric', () => {
      const runs = [createMockRun()]
      const fields = discoverAvailableFields(runs)

      const coinsField = fields.find(f => f.fieldName === 'coinsEarned')
      expect(coinsField?.isNumeric).toBe(true)
      expect(coinsField?.canHaveHourlyRate).toBe(true)

      const realTimeField = fields.find(f => f.fieldName === 'realTime')
      expect(realTimeField?.isNumeric).toBe(true)
      expect(realTimeField?.canHaveHourlyRate).toBe(false) // Duration fields can't have hourly rates
    })

    it('should sort fields alphabetically by display name', () => {
      const runs = [createMockRun()]
      const fields = discoverAvailableFields(runs)

      const displayNames = fields.map(f => f.displayName)
      const sorted = [...displayNames].sort()

      expect(displayNames).toEqual(sorted)
    })
  })

  describe('getUnselectedFields', () => {
    const availableFields: AvailableField[] = [
      { fieldName: 'wave', displayName: 'Wave', dataType: 'number', isNumeric: true, canHaveHourlyRate: true },
      { fieldName: 'coinsEarned', displayName: 'Coins Earned', dataType: 'number', isNumeric: true, canHaveHourlyRate: true },
      { fieldName: 'cellsEarned', displayName: 'Cells Earned', dataType: 'number', isNumeric: true, canHaveHourlyRate: true },
      { fieldName: 'shards', displayName: 'Shards', dataType: 'number', isNumeric: true, canHaveHourlyRate: true }
    ]

    it('should return fields not in selected columns', () => {
      const selected: TierStatsColumnConfig[] = [
        { fieldName: 'wave', showHourlyRate: false },
        { fieldName: 'coinsEarned', showHourlyRate: true }
      ]

      const unselected = getUnselectedFields(availableFields, selected)
      const fieldNames = unselected.map(f => f.fieldName)

      expect(fieldNames).toContain('cellsEarned')
      expect(fieldNames).toContain('shards')
      expect(fieldNames).not.toContain('wave')
      expect(fieldNames).not.toContain('coinsEarned')
    })

    it('should return all fields when none selected', () => {
      const unselected = getUnselectedFields(availableFields, [])
      expect(unselected).toEqual(availableFields)
    })

    it('should return empty array when all fields selected', () => {
      const selected: TierStatsColumnConfig[] = availableFields.map(f => ({
        fieldName: f.fieldName,
        showHourlyRate: false
      }))

      const unselected = getUnselectedFields(availableFields, selected)
      expect(unselected).toEqual([])
    })
  })

  describe('validateColumnConfig', () => {
    const availableFields: AvailableField[] = [
      { fieldName: 'wave', displayName: 'Wave', dataType: 'number', isNumeric: true, canHaveHourlyRate: true },
      { fieldName: 'coinsEarned', displayName: 'Coins Earned', dataType: 'number', isNumeric: true, canHaveHourlyRate: true }
    ]

    it('should keep valid columns', () => {
      const config: TierStatsColumnConfig[] = [
        { fieldName: 'wave', showHourlyRate: false },
        { fieldName: 'coinsEarned', showHourlyRate: true }
      ]

      const validated = validateColumnConfig(config, availableFields)
      expect(validated).toEqual(config)
    })

    it('should remove columns with non-existent fields', () => {
      const config: TierStatsColumnConfig[] = [
        { fieldName: 'wave', showHourlyRate: false },
        { fieldName: 'invalidField', showHourlyRate: false },
        { fieldName: 'coinsEarned', showHourlyRate: true }
      ]

      const validated = validateColumnConfig(config, availableFields)
      expect(validated).toHaveLength(2)
      expect(validated.map(c => c.fieldName)).toEqual(['wave', 'coinsEarned'])
    })

    it('should return empty array when no valid columns', () => {
      const config: TierStatsColumnConfig[] = [
        { fieldName: 'invalidField1', showHourlyRate: false },
        { fieldName: 'invalidField2', showHourlyRate: false }
      ]

      const validated = validateColumnConfig(config, availableFields)
      expect(validated).toEqual([])
    })
  })

  describe('isNumericField', () => {
    const availableFields: AvailableField[] = [
      { fieldName: 'wave', displayName: 'Wave', dataType: 'number', isNumeric: true, canHaveHourlyRate: true },
      { fieldName: 'realTime', displayName: 'Real Time', dataType: 'duration', isNumeric: true, canHaveHourlyRate: false },
      { fieldName: 'killedBy', displayName: 'Killed By', dataType: 'string', isNumeric: false, canHaveHourlyRate: false }
    ]

    it('should return true for numeric fields', () => {
      expect(isNumericField('wave', availableFields)).toBe(true)
      expect(isNumericField('realTime', availableFields)).toBe(true)
    })

    it('should return false for non-numeric fields', () => {
      expect(isNumericField('killedBy', availableFields)).toBe(false)
    })

    it('should return false for non-existent fields', () => {
      expect(isNumericField('invalidField', availableFields)).toBe(false)
    })
  })

  describe('getFieldDisplayName', () => {
    const availableFields: AvailableField[] = [
      { fieldName: 'coinsEarned', displayName: 'Coins Earned', dataType: 'number', isNumeric: true, canHaveHourlyRate: true },
      { fieldName: 'wave', displayName: 'Wave', dataType: 'number', isNumeric: true, canHaveHourlyRate: true }
    ]

    it('should return display name for existing field', () => {
      expect(getFieldDisplayName('coinsEarned', availableFields)).toBe('Coins Earned')
    })

    it('should return field name for non-existent field', () => {
      expect(getFieldDisplayName('invalidField', availableFields)).toBe('invalidField')
    })
  })

  describe('getColumnDisplayName', () => {
    const availableFields: AvailableField[] = [
      { fieldName: 'coinsEarned', displayName: 'Coins Earned', dataType: 'number', isNumeric: true, canHaveHourlyRate: true },
      { fieldName: 'realTime', displayName: 'Real Time', dataType: 'duration', isNumeric: true, canHaveHourlyRate: false },
      { fieldName: 'wave', displayName: 'Wave', dataType: 'number', isNumeric: true, canHaveHourlyRate: true }
    ]

    it('should return base display name when not hourly rate', () => {
      const name = getColumnDisplayName('coinsEarned', false, availableFields)
      expect(name).toBe('Coins Earned')
    })

    it('should append /Hour suffix for hourly rate columns', () => {
      const name = getColumnDisplayName('coinsEarned', true, availableFields)
      expect(name).toBe('Coins Earned/Hour')
    })

    it('should use special label for realTime non-hourly column', () => {
      const name = getColumnDisplayName('realTime', false, availableFields)
      expect(name).toBe('Longest Run Duration')
    })

    it('should use /Hour suffix for realTime hourly column', () => {
      const name = getColumnDisplayName('realTime', true, availableFields)
      expect(name).toBe('Real Time/Hour')
    })
  })
})
