import { describe, it, expect } from 'vitest'
import {
  formatDurationHoursMinutes,
  formatWaveNumber,
  formatTierWaveHeader,
  formatTimestampDisplay,
  createEnhancedRunHeader
} from './run-header-formatting'
import type { ParsedGameRun, GameRunField } from '../types/game-run.types'

// Helper function to create a mock field
function createMockField(
  value: number | string | Date,
  dataType: GameRunField['dataType'],
  originalKey: string
): GameRunField {
  return {
    value,
    rawValue: String(value),
    displayValue: String(value),
    originalKey,
    dataType,
  }
}

// Helper function to create a mock run
function createMockRun(overrides: Partial<ParsedGameRun> = {}): ParsedGameRun {
  return {
    id: 'test-id',
    timestamp: new Date('2024-08-17T15:45:00Z'),
    tier: 10,
    wave: 6008,
    coinsEarned: 1000,
    cellsEarned: 500,
    realTime: 31415, // 8hr 43min 35sec
    runType: 'farm',
    fields: {
      tier: createMockField(10, 'number', 'Tier'),
      wave: createMockField(6008, 'number', 'Wave'),
      realTime: createMockField(31415, 'duration', 'Real Time'),
    },
    ...overrides
  }
}

describe('run-header-formatting', () => {
  describe('formatDurationHoursMinutes', () => {
    it('should format duration with hours and minutes', () => {
      expect(formatDurationHoursMinutes(31415)).toBe('8hr 43min') // 8hr 43min 35sec
      expect(formatDurationHoursMinutes(7200)).toBe('2hr 0min') // exactly 2 hours
      expect(formatDurationHoursMinutes(3661)).toBe('1hr 1min') // 1hr 1min 1sec
    })

    it('should format duration with only minutes when under 1 hour', () => {
      expect(formatDurationHoursMinutes(3540)).toBe('59min') // 59 minutes
      expect(formatDurationHoursMinutes(60)).toBe('1min') // 1 minute
      expect(formatDurationHoursMinutes(30)).toBe('0min') // 30 seconds rounds down
    })

    it('should handle edge cases', () => {
      expect(formatDurationHoursMinutes(0)).toBe('0min')
      expect(formatDurationHoursMinutes(59)).toBe('0min') // less than 1 minute
      expect(formatDurationHoursMinutes(36000)).toBe('10hr 0min') // exactly 10 hours
    })
  })

  describe('formatWaveNumber', () => {
    it('should format wave numbers with thousands separator', () => {
      expect(formatWaveNumber(6008)).toBe('6,008')
      expect(formatWaveNumber(1234567)).toBe('1,234,567')
      expect(formatWaveNumber(100)).toBe('100') // no separator needed
    })

    it('should handle edge cases', () => {
      expect(formatWaveNumber(0)).toBe('0')
      expect(formatWaveNumber(1)).toBe('1')
      expect(formatWaveNumber(1000)).toBe('1,000')
    })
  })

  describe('formatTimestampDisplay', () => {
    it('should format timestamps to date/time string', () => {
      const timestamp1 = new Date('2024-08-17T15:45:00Z')
      expect(formatTimestampDisplay(timestamp1)).toMatch(/8\/17 \d{1,2}:\d{2} [AP]M/)
      
      const timestamp2 = new Date('2024-12-25T09:30:00Z')
      expect(formatTimestampDisplay(timestamp2)).toMatch(/12\/25 \d{1,2}:\d{2} [AP]M/)
      
      const timestamp3 = new Date('2024-01-01T00:00:00Z')
      expect(formatTimestampDisplay(timestamp3)).toMatch(/(12\/31|1\/1) \d{1,2}:\d{2} [AP]M/)
    })
    
    it('should handle different time zones correctly', () => {
      const timestamp = new Date('2024-06-15T22:15:00Z')
      const result = formatTimestampDisplay(timestamp)
      // Should be a valid date/time format
      expect(result).toMatch(/\d{1,2}\/\d{1,2} \d{1,2}:\d{2} [AP]M/)
    })
  })

  describe('formatTierWaveHeader', () => {
    it('should format tier and wave as primary header', () => {
      expect(formatTierWaveHeader(10, 6008)).toBe('T10 6,008')
      expect(formatTierWaveHeader(1, 100)).toBe('T1 100')
      expect(formatTierWaveHeader(25, 1234567)).toBe('T25 1,234,567')
    })

    it('should handle edge cases', () => {
      expect(formatTierWaveHeader(0, 0)).toBe('T0 0')
      expect(formatTierWaveHeader(1, 1000)).toBe('T1 1,000')
    })
  })

  describe('createEnhancedRunHeader', () => {
    it('should create 3-line enhanced header format', () => {
      const run = createMockRun({
        tier: 10,
        wave: 6008,
        realTime: 31415, // 8hr 43min 35sec
        timestamp: new Date('2024-08-17T15:45:00Z')
      })

      const result = createEnhancedRunHeader(run)
      
      // Extract the actual formatted date/time to compare structure
      const lines = result.header.split('\n')
      expect(lines).toHaveLength(3)
      expect(lines[0]).toBe('T10 6,008')
      expect(lines[1]).toBe('8hr 43min')
      expect(lines[2]).toMatch(/8\/17 \d{1,2}:\d{2} [AP]M/)
      expect(result.subHeader).toBeUndefined()
    })

    it('should handle runs with different tiers and waves', () => {
      const run = createMockRun({
        tier: 1,
        wave: 100,
        realTime: 3600, // 1hr exactly
        timestamp: new Date('2024-12-25T09:30:00Z')
      })

      const result = createEnhancedRunHeader(run)
      
      const lines = result.header.split('\n')
      expect(lines).toHaveLength(3)
      expect(lines[0]).toBe('T1 100')
      expect(lines[1]).toBe('1hr 0min')
      expect(lines[2]).toMatch(/12\/25 \d{1,2}:\d{2} [AP]M/)
    })

    it('should handle runs with duration under 1 hour', () => {
      const run = createMockRun({
        tier: 5,
        wave: 2500,
        realTime: 1800, // 30 minutes
        timestamp: new Date('2024-06-15T22:15:00Z')
      })

      const result = createEnhancedRunHeader(run)
      
      const lines = result.header.split('\n')
      expect(lines).toHaveLength(3)
      expect(lines[0]).toBe('T5 2,500')
      expect(lines[1]).toBe('30min')
      expect(lines[2]).toMatch(/6\/15 \d{1,2}:\d{2} [AP]M/)
    })

    it('should handle large wave numbers correctly', () => {
      const run = createMockRun({
        tier: 20,
        wave: 1500000,
        realTime: 43200, // 12 hours
        timestamp: new Date('2024-01-01T00:00:00Z')
      })

      const result = createEnhancedRunHeader(run)
      
      const lines = result.header.split('\n')
      expect(lines).toHaveLength(3)
      expect(lines[0]).toBe('T20 1,500,000')
      expect(lines[1]).toBe('12hr 0min')
      expect(lines[2]).toMatch(/(12\/31|1\/1) \d{1,2}:\d{2} [AP]M/)
    })
  })
})