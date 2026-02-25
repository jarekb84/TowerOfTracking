import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  loadHeatmapConfig,
  saveHeatmapConfig,
  clearHeatmapConfig
} from './heatmap-persistence'
import { DEFAULT_ACTIVE_HOURS } from '../types'
import type { ActiveHoursConfig } from '../types'

describe('heatmap-persistence', () => {
  const STORAGE_KEY = 'tower-tracking-activity-heatmap-config'

  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('loadHeatmapConfig', () => {
    it('should return default when localStorage is empty', () => {
      const config = loadHeatmapConfig()

      expect(config).toEqual(DEFAULT_ACTIVE_HOURS)
    })

    it('should return saved config when valid data exists', () => {
      const savedConfig: ActiveHoursConfig = {
        startHour: 6,
        endHour: 22,
        enabled: true
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedConfig))

      const loaded = loadHeatmapConfig()
      expect(loaded).toEqual(savedConfig)
    })

    it('should return default when localStorage has invalid JSON', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid json{')

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const config = loadHeatmapConfig()
      expect(config).toEqual(DEFAULT_ACTIVE_HOURS)

      consoleSpy.mockRestore()
    })

    it('should return default when localStorage has wrong shape (missing fields)', () => {
      const invalidConfig = {
        startHour: 8,
        // Missing endHour and enabled
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(invalidConfig))

      const config = loadHeatmapConfig()
      expect(config).toEqual(DEFAULT_ACTIVE_HOURS)
    })

    it('should return default when startHour is out of range', () => {
      const invalidConfig = {
        startHour: 25,
        endHour: 22,
        enabled: true
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(invalidConfig))

      const config = loadHeatmapConfig()
      expect(config).toEqual(DEFAULT_ACTIVE_HOURS)
    })

    it('should return default when endHour is out of range', () => {
      const invalidConfig = {
        startHour: 8,
        endHour: -1,
        enabled: true
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(invalidConfig))

      const config = loadHeatmapConfig()
      expect(config).toEqual(DEFAULT_ACTIVE_HOURS)
    })

    it('should return default when startHour is not an integer', () => {
      const invalidConfig = {
        startHour: 8.5,
        endHour: 22,
        enabled: true
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(invalidConfig))

      const config = loadHeatmapConfig()
      expect(config).toEqual(DEFAULT_ACTIVE_HOURS)
    })

    it('should return default when fields have wrong types', () => {
      const invalidConfig = {
        startHour: '8',
        endHour: 22,
        enabled: true
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(invalidConfig))

      const config = loadHeatmapConfig()
      expect(config).toEqual(DEFAULT_ACTIVE_HOURS)
    })
  })

  describe('saveHeatmapConfig', () => {
    it('should save config to localStorage', () => {
      const config: ActiveHoursConfig = {
        startHour: 6,
        endHour: 22,
        enabled: true
      }

      saveHeatmapConfig(config)

      const stored = localStorage.getItem(STORAGE_KEY)
      expect(stored).not.toBeNull()

      const parsed = JSON.parse(stored!)
      expect(parsed).toEqual(config)
    })

    it('should overwrite existing config', () => {
      const first: ActiveHoursConfig = {
        startHour: 6,
        endHour: 22,
        enabled: true
      }
      const second: ActiveHoursConfig = {
        startHour: 9,
        endHour: 17,
        enabled: false
      }

      saveHeatmapConfig(first)
      saveHeatmapConfig(second)

      const stored = localStorage.getItem(STORAGE_KEY)
      const parsed = JSON.parse(stored!)
      expect(parsed).toEqual(second)
    })

    it('should handle localStorage errors gracefully', () => {
      const config: ActiveHoursConfig = {
        startHour: 8,
        endHour: 23,
        enabled: false
      }

      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
      setItemSpy.mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => saveHeatmapConfig(config)).not.toThrow()
      expect(consoleSpy).toHaveBeenCalled()

      setItemSpy.mockRestore()
      consoleSpy.mockRestore()
    })
  })

  describe('clearHeatmapConfig', () => {
    it('should remove config from localStorage', () => {
      const config: ActiveHoursConfig = {
        startHour: 6,
        endHour: 22,
        enabled: true
      }
      saveHeatmapConfig(config)

      expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull()

      clearHeatmapConfig()

      expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    })

    it('should not throw when key does not exist', () => {
      expect(() => clearHeatmapConfig()).not.toThrow()
    })

    it('should handle localStorage errors gracefully', () => {
      const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem')
      removeItemSpy.mockImplementation(() => {
        throw new Error('Storage error')
      })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => clearHeatmapConfig()).not.toThrow()
      expect(consoleSpy).toHaveBeenCalled()

      removeItemSpy.mockRestore()
      consoleSpy.mockRestore()
    })
  })

  describe('roundtrip persistence', () => {
    it('should preserve config through save and load', () => {
      const original: ActiveHoursConfig = {
        startHour: 10,
        endHour: 20,
        enabled: true
      }

      saveHeatmapConfig(original)
      const loaded = loadHeatmapConfig()

      expect(loaded).toEqual(original)
    })
  })
})
