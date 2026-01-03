import { describe, it, expect } from 'vitest'
import {
  CURRENCY_ORDER,
  toggleCurrencyEnabled,
  isCurrencyEnabled,
  getEnabledCurrenciesInOrder,
} from './currency-config'
import { CurrencyId } from '../types'

describe('currency-enabled', () => {
  describe('toggleCurrencyEnabled', () => {
    it('should disable an enabled currency', () => {
      const enabled = [CurrencyId.Coins, CurrencyId.Stones, CurrencyId.Gems]
      const result = toggleCurrencyEnabled(enabled, CurrencyId.Stones)
      expect(result).toEqual([CurrencyId.Coins, CurrencyId.Gems])
    })

    it('should enable a disabled currency', () => {
      const enabled = [CurrencyId.Coins, CurrencyId.Gems]
      const result = toggleCurrencyEnabled(enabled, CurrencyId.Stones)
      // Should maintain CURRENCY_ORDER
      expect(result).toEqual([CurrencyId.Coins, CurrencyId.Stones, CurrencyId.Gems])
    })

    it('should not disable the last enabled currency', () => {
      const enabled = [CurrencyId.Coins]
      const result = toggleCurrencyEnabled(enabled, CurrencyId.Coins)
      expect(result).toEqual([CurrencyId.Coins])
    })

    it('should maintain CURRENCY_ORDER when enabling', () => {
      const enabled = [CurrencyId.Gems]
      const result = toggleCurrencyEnabled(enabled, CurrencyId.Coins)
      expect(result).toEqual([CurrencyId.Coins, CurrencyId.Gems])
    })

    it('should handle enabling RerollShards in correct order', () => {
      const enabled = [CurrencyId.Coins, CurrencyId.Gems]
      const result = toggleCurrencyEnabled(enabled, CurrencyId.RerollShards)
      expect(result).toEqual([CurrencyId.Coins, CurrencyId.RerollShards, CurrencyId.Gems])
    })
  })

  describe('isCurrencyEnabled', () => {
    it('should return true for enabled currency', () => {
      const enabled = [CurrencyId.Coins, CurrencyId.Stones]
      expect(isCurrencyEnabled(enabled, CurrencyId.Coins)).toBe(true)
      expect(isCurrencyEnabled(enabled, CurrencyId.Stones)).toBe(true)
    })

    it('should return false for disabled currency', () => {
      const enabled = [CurrencyId.Coins, CurrencyId.Stones]
      expect(isCurrencyEnabled(enabled, CurrencyId.Gems)).toBe(false)
      expect(isCurrencyEnabled(enabled, CurrencyId.RerollShards)).toBe(false)
    })

    it('should return false for empty enabled list', () => {
      const enabled: CurrencyId[] = []
      expect(isCurrencyEnabled(enabled, CurrencyId.Coins)).toBe(false)
    })
  })

  describe('getEnabledCurrenciesInOrder', () => {
    it('should return enabled currencies in CURRENCY_ORDER', () => {
      const enabled = [CurrencyId.Gems, CurrencyId.Coins, CurrencyId.Stones]
      const result = getEnabledCurrenciesInOrder(enabled)
      expect(result).toEqual([CurrencyId.Coins, CurrencyId.Stones, CurrencyId.Gems])
    })

    it('should filter out non-enabled currencies', () => {
      const enabled = [CurrencyId.Coins, CurrencyId.Gems]
      const result = getEnabledCurrenciesInOrder(enabled)
      expect(result).toEqual([CurrencyId.Coins, CurrencyId.Gems])
      expect(result).not.toContain(CurrencyId.Stones)
      expect(result).not.toContain(CurrencyId.RerollShards)
    })

    it('should return empty array for empty input', () => {
      const enabled: CurrencyId[] = []
      const result = getEnabledCurrenciesInOrder(enabled)
      expect(result).toEqual([])
    })

    it('should return all currencies in order when all enabled', () => {
      const enabled = [...CURRENCY_ORDER]
      const result = getEnabledCurrenciesInOrder(enabled)
      expect(result).toEqual(CURRENCY_ORDER)
    })
  })
})
