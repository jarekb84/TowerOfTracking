import { describe, it, expect } from 'vitest'
import {
  CURRENCY_CONFIGS,
  CURRENCY_ORDER,
  getCurrencyConfig,
  getAllCurrencyConfigs,
  isValidCurrencyId,
  createDefaultIncome,
  createDefaultStoneBreakdown,
  calculateStoneIncome,
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
  })

  describe('CURRENCY_ORDER', () => {
    it('should have coins before stones', () => {
      expect(CURRENCY_ORDER).toEqual([CurrencyId.Coins, CurrencyId.Stones])
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
  })

  describe('getAllCurrencyConfigs', () => {
    it('should return all configs in order', () => {
      const configs = getAllCurrencyConfigs()
      expect(configs).toHaveLength(2)
      expect(configs[0].id).toBe(CurrencyId.Coins)
      expect(configs[1].id).toBe(CurrencyId.Stones)
    })
  })

  describe('isValidCurrencyId', () => {
    it('should return true for coins', () => {
      expect(isValidCurrencyId(CurrencyId.Coins)).toBe(true)
    })

    it('should return true for stones', () => {
      expect(isValidCurrencyId(CurrencyId.Stones)).toBe(true)
    })

    it('should return false for invalid currency', () => {
      expect(isValidCurrencyId('gems')).toBe(false)
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
  })

  describe('createDefaultStoneBreakdown', () => {
    it('should create breakdown with all zeros', () => {
      const breakdown = createDefaultStoneBreakdown()
      expect(breakdown).toEqual({
        weeklyChallenges: 0,
        eventStore: 0,
        tournamentResults: 0,
      })
    })
  })

  describe('calculateStoneIncome', () => {
    it('should sum all breakdown sources', () => {
      const breakdown = {
        weeklyChallenges: 60,
        eventStore: 0,
        tournamentResults: 200,
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
      }
      expect(calculateStoneIncome(breakdown)).toBe(300)
    })
  })
})
