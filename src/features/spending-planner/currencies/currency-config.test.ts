import { describe, it, expect } from 'vitest'
import {
  CURRENCY_CONFIGS,
  CURRENCY_ORDER,
  CURRENCY_VISUAL_STYLES,
  getCurrencyConfig,
  getAllCurrencyConfigs,
  isValidCurrencyId,
  createDefaultIncome,
  createDefaultStoneBreakdown,
  calculateStoneIncome,
  getCurrencyVisualStyles,
} from './currency-config'
import { CurrencyId } from '../types'

describe('currency-config', () => {
  describe('CURRENCY_CONFIGS', () => {
    it('should define coins currency', () => {
      expect(CURRENCY_CONFIGS[CurrencyId.Coins]).toEqual({
        id: CurrencyId.Coins,
        displayName: 'Coins',
        abbreviation: 'c',
        color: 'text-yellow-400',
        hasUnitSelector: true,
      })
    })

    it('should define stones currency', () => {
      expect(CURRENCY_CONFIGS[CurrencyId.Stones]).toEqual({
        id: CurrencyId.Stones,
        displayName: 'Stones',
        abbreviation: 'st',
        color: 'text-emerald-400',
        hasUnitSelector: false,
      })
    })

    it('should define reroll shards currency', () => {
      expect(CURRENCY_CONFIGS[CurrencyId.RerollShards]).toEqual({
        id: CurrencyId.RerollShards,
        displayName: 'Reroll Shards',
        timelineName: 'Shards',
        abbreviation: 'rs',
        color: 'text-blue-400',
        hasUnitSelector: true,
      })
    })

    it('should define gems currency', () => {
      expect(CURRENCY_CONFIGS[CurrencyId.Gems]).toEqual({
        id: CurrencyId.Gems,
        displayName: 'Gems',
        abbreviation: 'g',
        color: 'text-purple-400',
        hasUnitSelector: false,
      })
    })
  })

  describe('CURRENCY_ORDER', () => {
    it('should have all currencies in correct order', () => {
      expect(CURRENCY_ORDER).toEqual([
        CurrencyId.Coins,
        CurrencyId.Stones,
        CurrencyId.RerollShards,
        CurrencyId.Gems,
      ])
    })
  })

  describe('getCurrencyConfig', () => {
    it('should return coins config', () => {
      const config = getCurrencyConfig(CurrencyId.Coins)
      expect(config.id).toBe(CurrencyId.Coins)
      expect(config.hasUnitSelector).toBe(true)
    })

    it('should return stones config', () => {
      const config = getCurrencyConfig(CurrencyId.Stones)
      expect(config.id).toBe(CurrencyId.Stones)
      expect(config.hasUnitSelector).toBe(false)
    })

    it('should return reroll shards config', () => {
      const config = getCurrencyConfig(CurrencyId.RerollShards)
      expect(config.id).toBe(CurrencyId.RerollShards)
      expect(config.hasUnitSelector).toBe(true)
    })

    it('should return gems config', () => {
      const config = getCurrencyConfig(CurrencyId.Gems)
      expect(config.id).toBe(CurrencyId.Gems)
      expect(config.hasUnitSelector).toBe(false)
    })
  })

  describe('getAllCurrencyConfigs', () => {
    it('should return all configs in order', () => {
      const configs = getAllCurrencyConfigs()
      expect(configs).toHaveLength(4)
      expect(configs[0].id).toBe(CurrencyId.Coins)
      expect(configs[1].id).toBe(CurrencyId.Stones)
      expect(configs[2].id).toBe(CurrencyId.RerollShards)
      expect(configs[3].id).toBe(CurrencyId.Gems)
    })
  })

  describe('isValidCurrencyId', () => {
    it('should return true for coins', () => {
      expect(isValidCurrencyId(CurrencyId.Coins)).toBe(true)
    })

    it('should return true for stones', () => {
      expect(isValidCurrencyId(CurrencyId.Stones)).toBe(true)
    })

    it('should return true for reroll shards', () => {
      expect(isValidCurrencyId(CurrencyId.RerollShards)).toBe(true)
    })

    it('should return true for gems', () => {
      expect(isValidCurrencyId(CurrencyId.Gems)).toBe(true)
    })

    it('should return false for invalid currency', () => {
      expect(isValidCurrencyId('gold')).toBe(false)
      expect(isValidCurrencyId('')).toBe(false)
      expect(isValidCurrencyId('invalid')).toBe(false)
    })
  })

  describe('createDefaultIncome', () => {
    it('should create default coins income with 5% growth', () => {
      const income = createDefaultIncome(CurrencyId.Coins)
      expect(income).toEqual({
        currencyId: CurrencyId.Coins,
        currentBalance: 0,
        weeklyIncome: 0,
        growthRatePercent: 5,
      })
    })

    it('should create default stones income with 0% growth', () => {
      const income = createDefaultIncome(CurrencyId.Stones)
      expect(income).toEqual({
        currencyId: CurrencyId.Stones,
        currentBalance: 0,
        weeklyIncome: 0,
        growthRatePercent: 0,
      })
    })

    it('should create default reroll shards income with 0% growth', () => {
      const income = createDefaultIncome(CurrencyId.RerollShards)
      expect(income).toEqual({
        currencyId: CurrencyId.RerollShards,
        currentBalance: 0,
        weeklyIncome: 0,
        growthRatePercent: 0,
      })
    })

    it('should create default gems income with 0% growth', () => {
      const income = createDefaultIncome(CurrencyId.Gems)
      expect(income).toEqual({
        currencyId: CurrencyId.Gems,
        currentBalance: 0,
        weeklyIncome: 0,
        growthRatePercent: 0,
      })
    })
  })

  describe('createDefaultStoneBreakdown', () => {
    it('should create breakdown with all zeros', () => {
      const breakdown = createDefaultStoneBreakdown()
      expect(breakdown).toEqual({
        weeklyChallenges: 0,
        eventStore: 0,
        tournamentResults: 0,
        purchasedWithMoney: 0,
      })
    })
  })

  describe('calculateStoneIncome', () => {
    it('should sum all breakdown sources', () => {
      const breakdown = {
        weeklyChallenges: 60,
        eventStore: 0,
        tournamentResults: 200,
        purchasedWithMoney: 0,
      }
      expect(calculateStoneIncome(breakdown)).toBe(260)
    })

    it('should return 0 for empty breakdown', () => {
      const breakdown = createDefaultStoneBreakdown()
      expect(calculateStoneIncome(breakdown)).toBe(0)
    })

    it('should handle all sources having values', () => {
      const breakdown = {
        weeklyChallenges: 100,
        eventStore: 50,
        tournamentResults: 150,
        purchasedWithMoney: 0,
      }
      expect(calculateStoneIncome(breakdown)).toBe(300)
    })

    it('should include purchased with money in total', () => {
      const breakdown = {
        weeklyChallenges: 100,
        eventStore: 50,
        tournamentResults: 100,
        purchasedWithMoney: 50,
      }
      expect(calculateStoneIncome(breakdown)).toBe(300)
    })
  })

  describe('CURRENCY_VISUAL_STYLES', () => {
    it('should define visual styles for all currencies', () => {
      expect(Object.keys(CURRENCY_VISUAL_STYLES)).toHaveLength(4)
      expect(CURRENCY_VISUAL_STYLES[CurrencyId.Coins]).toBeDefined()
      expect(CURRENCY_VISUAL_STYLES[CurrencyId.Stones]).toBeDefined()
      expect(CURRENCY_VISUAL_STYLES[CurrencyId.RerollShards]).toBeDefined()
      expect(CURRENCY_VISUAL_STYLES[CurrencyId.Gems]).toBeDefined()
    })

    it('should have all required style properties for each currency', () => {
      for (const currencyId of CURRENCY_ORDER) {
        const styles = CURRENCY_VISUAL_STYLES[currencyId]
        expect(styles.borderLeft).toBeDefined()
        expect(styles.bgGradient).toBeDefined()
        expect(styles.timelineBorderLeft).toBeDefined()
      }
    })

    it('should define coins visual styles', () => {
      expect(CURRENCY_VISUAL_STYLES[CurrencyId.Coins]).toEqual({
        borderLeft: 'border-l-yellow-400/40',
        bgGradient: 'bg-gradient-to-r from-yellow-500/10 to-transparent',
        timelineBorderLeft: 'border-l-2 border-l-yellow-400/50',
      })
    })

    it('should define stones visual styles', () => {
      expect(CURRENCY_VISUAL_STYLES[CurrencyId.Stones]).toEqual({
        borderLeft: 'border-l-emerald-400/40',
        bgGradient: 'bg-gradient-to-r from-emerald-500/10 to-transparent',
        timelineBorderLeft: 'border-l-2 border-l-emerald-400/50',
      })
    })

    it('should define reroll shards visual styles', () => {
      expect(CURRENCY_VISUAL_STYLES[CurrencyId.RerollShards]).toEqual({
        borderLeft: 'border-l-blue-400/40',
        bgGradient: 'bg-gradient-to-r from-blue-500/10 to-transparent',
        timelineBorderLeft: 'border-l-2 border-l-blue-400/50',
      })
    })

    it('should define gems visual styles', () => {
      expect(CURRENCY_VISUAL_STYLES[CurrencyId.Gems]).toEqual({
        borderLeft: 'border-l-purple-400/40',
        bgGradient: 'bg-gradient-to-r from-purple-500/10 to-transparent',
        timelineBorderLeft: 'border-l-2 border-l-purple-400/50',
      })
    })
  })

  describe('getCurrencyVisualStyles', () => {
    it('should return visual styles for coins', () => {
      const styles = getCurrencyVisualStyles(CurrencyId.Coins)
      expect(styles.borderLeft).toBe('border-l-yellow-400/40')
      expect(styles.bgGradient).toContain('yellow')
    })

    it('should return visual styles for stones', () => {
      const styles = getCurrencyVisualStyles(CurrencyId.Stones)
      expect(styles.borderLeft).toBe('border-l-emerald-400/40')
      expect(styles.bgGradient).toContain('emerald')
    })

    it('should return visual styles for reroll shards', () => {
      const styles = getCurrencyVisualStyles(CurrencyId.RerollShards)
      expect(styles.borderLeft).toBe('border-l-blue-400/40')
      expect(styles.bgGradient).toContain('blue')
    })

    it('should return visual styles for gems', () => {
      const styles = getCurrencyVisualStyles(CurrencyId.Gems)
      expect(styles.borderLeft).toBe('border-l-purple-400/40')
      expect(styles.bgGradient).toContain('purple')
    })
  })
})
