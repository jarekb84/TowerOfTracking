import { describe, it, expect, beforeEach } from 'vitest'
import { loadMovingAveragePeriod, saveMovingAveragePeriod, clearMovingAverageConfig } from './moving-average-persistence'

describe('moving-average-persistence', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
  })

  describe('loadMovingAveragePeriod', () => {
    it('returns "none" when no stored value exists', () => {
      const result = loadMovingAveragePeriod('coinsEarned')
      expect(result).toBe('none')
    })

    it('returns stored numeric value when present', () => {
      localStorage.setItem('tower-tracking-moving-average-config', JSON.stringify({
        coinsEarned: 5,
      }))

      const result = loadMovingAveragePeriod('coinsEarned')
      expect(result).toBe(5)
    })

    it('returns stored "none" value when present', () => {
      localStorage.setItem('tower-tracking-moving-average-config', JSON.stringify({
        coinsEarned: 'none',
      }))

      const result = loadMovingAveragePeriod('coinsEarned')
      expect(result).toBe('none')
    })

    it('returns different values for different metrics', () => {
      localStorage.setItem('tower-tracking-moving-average-config', JSON.stringify({
        coinsEarned: 3,
        cellsEarned: 10,
        totalDamage: 'none',
      }))

      expect(loadMovingAveragePeriod('coinsEarned')).toBe(3)
      expect(loadMovingAveragePeriod('cellsEarned')).toBe(10)
      expect(loadMovingAveragePeriod('totalDamage')).toBe('none')
    })

    it('returns "none" for unknown metric key', () => {
      localStorage.setItem('tower-tracking-moving-average-config', JSON.stringify({
        coinsEarned: 5,
      }))

      const result = loadMovingAveragePeriod('unknownMetric')
      expect(result).toBe('none')
    })

    it('returns "none" for invalid stored value', () => {
      localStorage.setItem('tower-tracking-moving-average-config', JSON.stringify({
        coinsEarned: 7, // Invalid moving average period
      }))

      const result = loadMovingAveragePeriod('coinsEarned')
      expect(result).toBe('none')
    })

    it('returns "none" when stored JSON is malformed', () => {
      localStorage.setItem('tower-tracking-moving-average-config', 'not valid json')

      const result = loadMovingAveragePeriod('coinsEarned')
      expect(result).toBe('none')
    })
  })

  describe('saveMovingAveragePeriod', () => {
    it('saves value to localStorage', () => {
      saveMovingAveragePeriod('coinsEarned', 5)

      const stored = localStorage.getItem('tower-tracking-moving-average-config')
      expect(stored).toBeTruthy()
      expect(JSON.parse(stored!)).toEqual({ coinsEarned: 5 })
    })

    it('merges with existing config', () => {
      localStorage.setItem('tower-tracking-moving-average-config', JSON.stringify({
        cellsEarned: 10,
      }))

      saveMovingAveragePeriod('coinsEarned', 5)

      const stored = localStorage.getItem('tower-tracking-moving-average-config')
      expect(JSON.parse(stored!)).toEqual({
        cellsEarned: 10,
        coinsEarned: 5,
      })
    })

    it('overwrites existing value for same metric', () => {
      localStorage.setItem('tower-tracking-moving-average-config', JSON.stringify({
        coinsEarned: 3,
      }))

      saveMovingAveragePeriod('coinsEarned', 10)

      const stored = localStorage.getItem('tower-tracking-moving-average-config')
      expect(JSON.parse(stored!)).toEqual({ coinsEarned: 10 })
    })

    it('handles "none" value', () => {
      saveMovingAveragePeriod('coinsEarned', 'none')

      const stored = localStorage.getItem('tower-tracking-moving-average-config')
      expect(JSON.parse(stored!)).toEqual({ coinsEarned: 'none' })
    })
  })

  describe('clearMovingAverageConfig', () => {
    it('removes config from localStorage', () => {
      localStorage.setItem('tower-tracking-moving-average-config', JSON.stringify({
        coinsEarned: 5,
      }))

      clearMovingAverageConfig()

      expect(localStorage.getItem('tower-tracking-moving-average-config')).toBeNull()
    })

    it('does not throw when no config exists', () => {
      expect(() => clearMovingAverageConfig()).not.toThrow()
    })
  })

  describe('SSR safety', () => {
    it('loadMovingAveragePeriod handles SSR environment', () => {
      // Mock window being undefined
      const originalWindow = global.window
      // @ts-expect-error - Testing SSR behavior
      delete global.window

      // This should not throw and return default
      const result = loadMovingAveragePeriod('coinsEarned')
      expect(result).toBe('none')

      // Restore window
      global.window = originalWindow
    })

    it('saveMovingAveragePeriod handles SSR environment silently', () => {
      const originalWindow = global.window
      // @ts-expect-error - Testing SSR behavior
      delete global.window

      // This should not throw
      expect(() => saveMovingAveragePeriod('coinsEarned', 5)).not.toThrow()

      global.window = originalWindow
    })
  })
})
