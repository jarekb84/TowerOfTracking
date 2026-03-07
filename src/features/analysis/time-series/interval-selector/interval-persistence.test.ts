import { describe, it, expect, beforeEach } from 'vitest'
import { Duration } from '@/shared/domain/filters/types'
import {
  loadPersistedDuration,
  savePersistedDuration,
  loadPersistedIntervalCount,
  savePersistedIntervalCount,
  clearTimeSeriesFilterConfig,
} from './interval-persistence'

const STORAGE_KEY = 'tower-tracking-time-series-filters'

describe('interval-persistence', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('loadPersistedDuration', () => {
    it('returns null when no stored value exists', () => {
      expect(loadPersistedDuration()).toBeNull()
    })

    it('returns stored duration value', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ duration: 'daily' }))
      expect(loadPersistedDuration()).toBe(Duration.DAILY)
    })

    it('returns null for invalid duration value', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ duration: 'invalid' }))
      expect(loadPersistedDuration()).toBeNull()
    })

    it('returns null for malformed JSON', () => {
      localStorage.setItem(STORAGE_KEY, 'not valid json')
      expect(loadPersistedDuration()).toBeNull()
    })
  })

  describe('savePersistedDuration', () => {
    it('saves duration to localStorage', () => {
      savePersistedDuration(Duration.DAILY)

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
      expect(stored.duration).toBe('daily')
    })

    it('merges with existing config', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ periodCounts: { daily: 14 } })
      )

      savePersistedDuration(Duration.WEEKLY)

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
      expect(stored.duration).toBe('weekly')
      expect(stored.periodCounts).toEqual({ daily: 14 })
    })
  })

  describe('loadPersistedIntervalCount', () => {
    it('returns null when no stored value exists', () => {
      expect(loadPersistedIntervalCount(Duration.DAILY)).toBeNull()
    })

    it('returns stored numeric count', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ periodCounts: { daily: 14 } })
      )
      expect(loadPersistedIntervalCount(Duration.DAILY)).toBe(14)
    })

    it('returns "all" when stored as "all"', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ periodCounts: { daily: 'all' } })
      )
      expect(loadPersistedIntervalCount(Duration.DAILY)).toBe('all')
    })

    it('returns null for duration without stored count', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ periodCounts: { daily: 14 } })
      )
      expect(loadPersistedIntervalCount(Duration.WEEKLY)).toBeNull()
    })

    it('returns null for invalid stored value', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ periodCounts: { daily: -1 } })
      )
      expect(loadPersistedIntervalCount(Duration.DAILY)).toBeNull()
    })
  })

  describe('savePersistedIntervalCount', () => {
    it('saves interval count for a duration', () => {
      savePersistedIntervalCount(Duration.DAILY, 14)

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
      expect(stored.periodCounts.daily).toBe(14)
    })

    it('saves "all" for a duration', () => {
      savePersistedIntervalCount(Duration.DAILY, 'all')

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
      expect(stored.periodCounts.daily).toBe('all')
    })

    it('merges with existing period counts', () => {
      savePersistedIntervalCount(Duration.DAILY, 14)
      savePersistedIntervalCount(Duration.WEEKLY, 10)

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
      expect(stored.periodCounts).toEqual({ daily: 14, weekly: 10 })
    })

    it('overwrites existing value for same duration', () => {
      savePersistedIntervalCount(Duration.DAILY, 14)
      savePersistedIntervalCount(Duration.DAILY, 7)

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
      expect(stored.periodCounts.daily).toBe(7)
    })
  })

  describe('clearTimeSeriesFilterConfig', () => {
    it('removes config from localStorage', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ duration: 'daily' }))
      clearTimeSeriesFilterConfig()
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    })

    it('does not throw when no config exists', () => {
      expect(() => clearTimeSeriesFilterConfig()).not.toThrow()
    })
  })

  describe('SSR safety', () => {
    it('loadPersistedDuration handles SSR environment', () => {
      const originalWindow = global.window
      // @ts-expect-error - Testing SSR behavior
      delete global.window

      expect(loadPersistedDuration()).toBeNull()

      global.window = originalWindow
    })

    it('savePersistedDuration handles SSR environment silently', () => {
      const originalWindow = global.window
      // @ts-expect-error - Testing SSR behavior
      delete global.window

      expect(() => savePersistedDuration(Duration.DAILY)).not.toThrow()

      global.window = originalWindow
    })
  })
})
