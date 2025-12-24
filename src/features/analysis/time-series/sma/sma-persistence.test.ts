import { describe, it, expect, beforeEach } from 'vitest'
import { loadSmaOption, saveSmaOption, clearSmaConfig } from './sma-persistence'

describe('sma-persistence', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
  })

  describe('loadSmaOption', () => {
    it('returns "none" when no stored value exists', () => {
      const result = loadSmaOption('coinsEarned')
      expect(result).toBe('none')
    })

    it('returns stored numeric value when present', () => {
      localStorage.setItem('tower-tracking-sma-config', JSON.stringify({
        coinsEarned: 5,
      }))

      const result = loadSmaOption('coinsEarned')
      expect(result).toBe(5)
    })

    it('returns stored "none" value when present', () => {
      localStorage.setItem('tower-tracking-sma-config', JSON.stringify({
        coinsEarned: 'none',
      }))

      const result = loadSmaOption('coinsEarned')
      expect(result).toBe('none')
    })

    it('returns different values for different metrics', () => {
      localStorage.setItem('tower-tracking-sma-config', JSON.stringify({
        coinsEarned: 3,
        cellsEarned: 10,
        totalDamage: 'none',
      }))

      expect(loadSmaOption('coinsEarned')).toBe(3)
      expect(loadSmaOption('cellsEarned')).toBe(10)
      expect(loadSmaOption('totalDamage')).toBe('none')
    })

    it('returns "none" for unknown metric key', () => {
      localStorage.setItem('tower-tracking-sma-config', JSON.stringify({
        coinsEarned: 5,
      }))

      const result = loadSmaOption('unknownMetric')
      expect(result).toBe('none')
    })

    it('returns "none" for invalid stored value', () => {
      localStorage.setItem('tower-tracking-sma-config', JSON.stringify({
        coinsEarned: 7, // Invalid SMA option
      }))

      const result = loadSmaOption('coinsEarned')
      expect(result).toBe('none')
    })

    it('returns "none" when stored JSON is malformed', () => {
      localStorage.setItem('tower-tracking-sma-config', 'not valid json')

      const result = loadSmaOption('coinsEarned')
      expect(result).toBe('none')
    })
  })

  describe('saveSmaOption', () => {
    it('saves value to localStorage', () => {
      saveSmaOption('coinsEarned', 5)

      const stored = localStorage.getItem('tower-tracking-sma-config')
      expect(stored).toBeTruthy()
      expect(JSON.parse(stored!)).toEqual({ coinsEarned: 5 })
    })

    it('merges with existing config', () => {
      localStorage.setItem('tower-tracking-sma-config', JSON.stringify({
        cellsEarned: 10,
      }))

      saveSmaOption('coinsEarned', 5)

      const stored = localStorage.getItem('tower-tracking-sma-config')
      expect(JSON.parse(stored!)).toEqual({
        cellsEarned: 10,
        coinsEarned: 5,
      })
    })

    it('overwrites existing value for same metric', () => {
      localStorage.setItem('tower-tracking-sma-config', JSON.stringify({
        coinsEarned: 3,
      }))

      saveSmaOption('coinsEarned', 10)

      const stored = localStorage.getItem('tower-tracking-sma-config')
      expect(JSON.parse(stored!)).toEqual({ coinsEarned: 10 })
    })

    it('handles "none" value', () => {
      saveSmaOption('coinsEarned', 'none')

      const stored = localStorage.getItem('tower-tracking-sma-config')
      expect(JSON.parse(stored!)).toEqual({ coinsEarned: 'none' })
    })
  })

  describe('clearSmaConfig', () => {
    it('removes config from localStorage', () => {
      localStorage.setItem('tower-tracking-sma-config', JSON.stringify({
        coinsEarned: 5,
      }))

      clearSmaConfig()

      expect(localStorage.getItem('tower-tracking-sma-config')).toBeNull()
    })

    it('does not throw when no config exists', () => {
      expect(() => clearSmaConfig()).not.toThrow()
    })
  })

  describe('SSR safety', () => {
    it('loadSmaOption handles SSR environment', () => {
      // Mock window being undefined
      const originalWindow = global.window
      // @ts-expect-error - Testing SSR behavior
      delete global.window

      // This should not throw and return default
      const result = loadSmaOption('coinsEarned')
      expect(result).toBe('none')

      // Restore window
      global.window = originalWindow
    })

    it('saveSmaOption handles SSR environment silently', () => {
      const originalWindow = global.window
      // @ts-expect-error - Testing SSR behavior
      delete global.window

      // This should not throw
      expect(() => saveSmaOption('coinsEarned', 5)).not.toThrow()

      global.window = originalWindow
    })
  })
})
