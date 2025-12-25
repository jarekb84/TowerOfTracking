import { describe, it, expect } from 'vitest'
import {
  formatDurationHoursMinutes,
  formatWaveNumber,
  formatTierWaveHeader,
  formatTimestampDisplay,
  formatGameSpeed,
} from './run-display-formatters'

describe('run-display-formatters', () => {
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

  describe('formatGameSpeed', () => {
    it('should format with 3 decimal places and x suffix', () => {
      expect(formatGameSpeed(1.5)).toBe('1.500x')
    })

    it('should format whole numbers with 3 decimal places', () => {
      expect(formatGameSpeed(2)).toBe('2.000x')
      expect(formatGameSpeed(1)).toBe('1.000x')
    })

    it('should round to 3 decimal places', () => {
      expect(formatGameSpeed(2.12345)).toBe('2.123x')
      expect(formatGameSpeed(1.9999)).toBe('2.000x')
    })

    it('should handle values less than 1', () => {
      expect(formatGameSpeed(0.5)).toBe('0.500x')
      expect(formatGameSpeed(0.125)).toBe('0.125x')
    })
  })
})
