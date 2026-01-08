import { describe, it, expect, beforeEach } from 'vitest'
import {
  loadTrendWindow,
  saveTrendWindow,
  clearTrendWindowConfig,
  buildCompoundKey,
} from './moving-average-persistence'

describe('moving-average-persistence', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('buildCompoundKey', () => {
    it('creates compound key from metric and period', () => {
      expect(buildCompoundKey('coinsEarned', 'daily')).toBe('coinsEarned:daily')
      expect(buildCompoundKey('totalDamage', 'weekly')).toBe('totalDamage:weekly')
      expect(buildCompoundKey('cellsEarned', 'run')).toBe('cellsEarned:run')
    })
  })

  describe('loadTrendWindow', () => {
    it('returns "none" when no stored value exists', () => {
      const result = loadTrendWindow('coinsEarned', 'daily')
      expect(result).toBe('none')
    })

    it('returns stored value when present', () => {
      localStorage.setItem(
        'tower-tracking-moving-average-config',
        JSON.stringify({
          'coinsEarned:daily': '7d',
        })
      )

      const result = loadTrendWindow('coinsEarned', 'daily')
      expect(result).toBe('7d')
    })

    it('returns stored "none" value when present', () => {
      localStorage.setItem(
        'tower-tracking-moving-average-config',
        JSON.stringify({
          'coinsEarned:daily': 'none',
        })
      )

      const result = loadTrendWindow('coinsEarned', 'daily')
      expect(result).toBe('none')
    })

    it('returns different values for different metric+period combinations', () => {
      localStorage.setItem(
        'tower-tracking-moving-average-config',
        JSON.stringify({
          'coinsEarned:daily': '7d',
          'coinsEarned:weekly': '2w',
          'totalDamage:daily': '14d',
        })
      )

      expect(loadTrendWindow('coinsEarned', 'daily')).toBe('7d')
      expect(loadTrendWindow('coinsEarned', 'weekly')).toBe('2w')
      expect(loadTrendWindow('totalDamage', 'daily')).toBe('14d')
    })

    it('returns "none" for unknown metric+period combination', () => {
      localStorage.setItem(
        'tower-tracking-moving-average-config',
        JSON.stringify({
          'coinsEarned:daily': '7d',
        })
      )

      const result = loadTrendWindow('unknownMetric', 'daily')
      expect(result).toBe('none')
    })

    it('returns "none" for invalid stored value', () => {
      localStorage.setItem(
        'tower-tracking-moving-average-config',
        JSON.stringify({
          'coinsEarned:daily': 'invalidValue',
        })
      )

      const result = loadTrendWindow('coinsEarned', 'daily')
      expect(result).toBe('none')
    })

    it('returns "none" when stored JSON is malformed', () => {
      localStorage.setItem('tower-tracking-moving-average-config', 'not valid json')

      const result = loadTrendWindow('coinsEarned', 'daily')
      expect(result).toBe('none')
    })
  })

  describe('saveTrendWindow', () => {
    it('saves value to localStorage with compound key', () => {
      saveTrendWindow('coinsEarned', 'daily', '7d')

      const stored = localStorage.getItem('tower-tracking-moving-average-config')
      expect(stored).toBeTruthy()
      expect(JSON.parse(stored!)).toEqual({ 'coinsEarned:daily': '7d' })
    })

    it('merges with existing config', () => {
      localStorage.setItem(
        'tower-tracking-moving-average-config',
        JSON.stringify({
          'cellsEarned:weekly': '2w',
        })
      )

      saveTrendWindow('coinsEarned', 'daily', '7d')

      const stored = localStorage.getItem('tower-tracking-moving-average-config')
      expect(JSON.parse(stored!)).toEqual({
        'cellsEarned:weekly': '2w',
        'coinsEarned:daily': '7d',
      })
    })

    it('overwrites existing value for same metric+period', () => {
      localStorage.setItem(
        'tower-tracking-moving-average-config',
        JSON.stringify({
          'coinsEarned:daily': '3d',
        })
      )

      saveTrendWindow('coinsEarned', 'daily', '14d')

      const stored = localStorage.getItem('tower-tracking-moving-average-config')
      expect(JSON.parse(stored!)).toEqual({ 'coinsEarned:daily': '14d' })
    })

    it('handles "none" value', () => {
      saveTrendWindow('coinsEarned', 'daily', 'none')

      const stored = localStorage.getItem('tower-tracking-moving-average-config')
      expect(JSON.parse(stored!)).toEqual({ 'coinsEarned:daily': 'none' })
    })

    it('stores independent values for same metric with different periods', () => {
      saveTrendWindow('coinsEarned', 'daily', '7d')
      saveTrendWindow('coinsEarned', 'weekly', '2w')
      saveTrendWindow('coinsEarned', 'monthly', '3m')

      const stored = localStorage.getItem('tower-tracking-moving-average-config')
      expect(JSON.parse(stored!)).toEqual({
        'coinsEarned:daily': '7d',
        'coinsEarned:weekly': '2w',
        'coinsEarned:monthly': '3m',
      })
    })
  })

  describe('clearTrendWindowConfig', () => {
    it('removes config from localStorage', () => {
      localStorage.setItem(
        'tower-tracking-moving-average-config',
        JSON.stringify({
          'coinsEarned:daily': '7d',
        })
      )

      clearTrendWindowConfig()

      expect(localStorage.getItem('tower-tracking-moving-average-config')).toBeNull()
    })

    it('does not throw when no config exists', () => {
      expect(() => clearTrendWindowConfig()).not.toThrow()
    })
  })

  describe('legacy format migration', () => {
    it('clears legacy format (bare numbers) and returns default', () => {
      // Legacy format: { "coinsEarned": 5, "totalDamage": 3 }
      localStorage.setItem(
        'tower-tracking-moving-average-config',
        JSON.stringify({
          coinsEarned: 5,
          totalDamage: 3,
        })
      )

      // Loading should detect legacy format and clear it
      const result = loadTrendWindow('coinsEarned', 'daily')
      expect(result).toBe('none')

      // Storage should be cleared
      expect(localStorage.getItem('tower-tracking-moving-average-config')).toBeNull()
    })

    it('handles mixed legacy and new format by treating as legacy', () => {
      localStorage.setItem(
        'tower-tracking-moving-average-config',
        JSON.stringify({
          coinsEarned: 5, // Legacy numeric value
          'totalDamage:daily': '7d', // New format
        })
      )

      // Should detect legacy format and clear all
      const result = loadTrendWindow('coinsEarned', 'daily')
      expect(result).toBe('none')
      expect(localStorage.getItem('tower-tracking-moving-average-config')).toBeNull()
    })
  })

  describe('SSR safety', () => {
    it('loadTrendWindow handles SSR environment', () => {
      const originalWindow = global.window
      // @ts-expect-error - Testing SSR behavior
      delete global.window

      const result = loadTrendWindow('coinsEarned', 'daily')
      expect(result).toBe('none')

      global.window = originalWindow
    })

    it('saveTrendWindow handles SSR environment silently', () => {
      const originalWindow = global.window
      // @ts-expect-error - Testing SSR behavior
      delete global.window

      expect(() => saveTrendWindow('coinsEarned', 'daily', '7d')).not.toThrow()

      global.window = originalWindow
    })
  })
})
