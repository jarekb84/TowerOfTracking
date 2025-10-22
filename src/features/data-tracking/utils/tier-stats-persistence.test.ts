import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  loadTierStatsConfig,
  saveTierStatsConfig,
  clearTierStatsConfig
} from './tier-stats-persistence'
import { getDefaultConfig } from './tier-stats-config'
import type { TierStatsConfig } from '../types/tier-stats-config.types'

describe('tier-stats-persistence', () => {
  const STORAGE_KEY = 'tower-tracking-tier-stats-config'

  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('loadTierStatsConfig', () => {
    it('should return default config when nothing in localStorage', () => {
      const config = loadTierStatsConfig()
      const defaultConfig = getDefaultConfig()

      expect(config.selectedColumns).toEqual(defaultConfig.selectedColumns)
      expect(config.configSectionCollapsed).toBe(defaultConfig.configSectionCollapsed)
    })

    it('should load valid config from localStorage but always start collapsed', () => {
      const savedConfig: TierStatsConfig = {
        selectedColumns: [
          { fieldName: 'wave', showHourlyRate: false },
          { fieldName: 'shards', showHourlyRate: true }
        ],
        configSectionCollapsed: false, // Saved as expanded
        lastUpdated: Date.now()
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedConfig))

      const loaded = loadTierStatsConfig()
      expect(loaded.selectedColumns).toEqual(savedConfig.selectedColumns)
      // Should always load collapsed, regardless of saved state
      expect(loaded.configSectionCollapsed).toBe(true)
    })

    it('should return default config for invalid JSON', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid json{')

      const config = loadTierStatsConfig()
      const defaultConfig = getDefaultConfig()

      expect(config.selectedColumns).toEqual(defaultConfig.selectedColumns)
    })

    it('should return default config for missing required fields', () => {
      const invalidConfig = {
        selectedColumns: [{ fieldName: 'wave', showHourlyRate: false }],
        // Missing configSectionCollapsed
        lastUpdated: Date.now()
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(invalidConfig))

      const config = loadTierStatsConfig()
      const defaultConfig = getDefaultConfig()

      expect(config).toEqual(defaultConfig)
    })

    it('should return default config for invalid column structure', () => {
      const invalidConfig = {
        selectedColumns: [
          { fieldName: 'wave' } // Missing showHourlyRate
        ],
        configSectionCollapsed: true,
        lastUpdated: Date.now()
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(invalidConfig))

      const config = loadTierStatsConfig()
      const defaultConfig = getDefaultConfig()

      expect(config).toEqual(defaultConfig)
    })

    it('should return default config when selectedColumns is not an array', () => {
      const invalidConfig = {
        selectedColumns: { wave: true }, // Not an array
        configSectionCollapsed: true,
        lastUpdated: Date.now()
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(invalidConfig))

      const config = loadTierStatsConfig()
      const defaultConfig = getDefaultConfig()

      expect(config).toEqual(defaultConfig)
    })
  })

  describe('saveTierStatsConfig', () => {
    it('should save config to localStorage', () => {
      const config: TierStatsConfig = {
        selectedColumns: [
          { fieldName: 'wave', showHourlyRate: false },
          { fieldName: 'coinsEarned', showHourlyRate: true }
        ],
        configSectionCollapsed: false,
        lastUpdated: 12345
      }

      saveTierStatsConfig(config)

      const stored = localStorage.getItem(STORAGE_KEY)
      expect(stored).not.toBeNull()

      const parsed = JSON.parse(stored!)
      expect(parsed.selectedColumns).toEqual(config.selectedColumns)
      expect(parsed.configSectionCollapsed).toBe(config.configSectionCollapsed)
    })

    it('should update lastUpdated timestamp', () => {
      const config: TierStatsConfig = {
        selectedColumns: [],
        configSectionCollapsed: true,
        lastUpdated: 12345
      }

      const beforeSave = Date.now()
      saveTierStatsConfig(config)
      const afterSave = Date.now()

      const stored = localStorage.getItem(STORAGE_KEY)
      const parsed = JSON.parse(stored!)

      expect(parsed.lastUpdated).toBeGreaterThanOrEqual(beforeSave)
      expect(parsed.lastUpdated).toBeLessThanOrEqual(afterSave)
    })

    it('should handle localStorage errors gracefully', () => {
      const config = getDefaultConfig()

      // Mock localStorage to throw an error
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
      setItemSpy.mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => saveTierStatsConfig(config)).not.toThrow()
      expect(consoleSpy).toHaveBeenCalled()

      setItemSpy.mockRestore()
      consoleSpy.mockRestore()
    })
  })

  describe('clearTierStatsConfig', () => {
    it('should remove config from localStorage', () => {
      const config = getDefaultConfig()
      saveTierStatsConfig(config)

      expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull()

      clearTierStatsConfig()

      expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    })

    it('should handle localStorage errors gracefully', () => {
      const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem')
      removeItemSpy.mockImplementation(() => {
        throw new Error('Storage error')
      })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => clearTierStatsConfig()).not.toThrow()
      expect(consoleSpy).toHaveBeenCalled()

      removeItemSpy.mockRestore()
      consoleSpy.mockRestore()
    })
  })

  describe('roundtrip persistence', () => {
    it('should preserve column config but not collapsed state through save and load', () => {
      const original: TierStatsConfig = {
        selectedColumns: [
          { fieldName: 'wave', showHourlyRate: false },
          { fieldName: 'coinsEarned', showHourlyRate: true },
          { fieldName: 'shards', showHourlyRate: false }
        ],
        configSectionCollapsed: false, // Saved as expanded
        lastUpdated: Date.now()
      }

      saveTierStatsConfig(original)
      const loaded = loadTierStatsConfig()

      // Column config should persist
      expect(loaded.selectedColumns).toEqual(original.selectedColumns)
      // But collapsed state should always be true on load (per PRD requirement 3.5)
      expect(loaded.configSectionCollapsed).toBe(true)
      expect(loaded.lastUpdated).toBeGreaterThanOrEqual(original.lastUpdated)
    })
  })
})
