import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getDefaultState,
  loadSpendingPlannerState,
  saveSpendingPlannerState,
  clearSpendingPlannerState,
} from './spending-planner-persistence'
import { CurrencyId } from '../types'

describe('spending-planner-persistence', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  describe('getDefaultState', () => {
    it('should return state with default incomes for all currencies', () => {
      const state = getDefaultState()
      expect(state.incomes).toHaveLength(4)
      expect(state.incomes[0].currencyId).toBe(CurrencyId.Coins)
      expect(state.incomes[1].currencyId).toBe(CurrencyId.Stones)
      expect(state.incomes[2].currencyId).toBe(CurrencyId.RerollShards)
      expect(state.incomes[3].currencyId).toBe(CurrencyId.Gems)
    })

    it('should return coins with 5% default growth', () => {
      const state = getDefaultState()
      const coins = state.incomes.find((i) => i.currencyId === CurrencyId.Coins)
      expect(coins?.growthRatePercent).toBe(5)
    })

    it('should return stones with 0% default growth', () => {
      const state = getDefaultState()
      const stones = state.incomes.find((i) => i.currencyId === CurrencyId.Stones)
      expect(stones?.growthRatePercent).toBe(0)
    })

    it('should return empty events array', () => {
      const state = getDefaultState()
      expect(state.events).toEqual([])
    })

    it('should return default timeline config of 12 weeks', () => {
      const state = getDefaultState()
      expect(state.timelineConfig.weeks).toBe(12)
    })

    it('should return default timeline config with columns layout', () => {
      const state = getDefaultState()
      expect(state.timelineConfig.layoutMode).toBe('columns')
    })

    it('should return default stone breakdown with all zeros', () => {
      const state = getDefaultState()
      expect(state.stoneIncomeBreakdown).toEqual({
        weeklyChallenges: 0,
        eventStore: 0,
        tournamentResults: 0,
        purchasedWithMoney: 0,
      })
    })

    it('should return default gem breakdown with all zeros', () => {
      const state = getDefaultState()
      expect(state.gemIncomeBreakdown).toEqual({
        adGems: 0,
        floatingGems: 0,
        storeDailyGems: 0,
        storeWeeklyGems: 0,
        missionsDailyCompletion: 0,
        missionsWeeklyChests: 0,
        tournaments: 0,
        biweeklyEventShop: 0,
        guildWeeklyChests: 0,
        guildSeasonalStore: 0,
        offerWalls: 0,
        purchasedWithMoney: 0,
      })
    })

    it('should return all currencies enabled by default', () => {
      const state = getDefaultState()
      expect(state.enabledCurrencies).toEqual([
        CurrencyId.Coins,
        CurrencyId.Stones,
        CurrencyId.RerollShards,
        CurrencyId.Gems,
      ])
    })
  })

  describe('loadSpendingPlannerState', () => {
    it('should return default state when nothing stored', () => {
      const state = loadSpendingPlannerState()
      expect(state.incomes).toHaveLength(4)
      expect(state.events).toEqual([])
    })

    it('should load valid stored state and migrate old breakdowns', () => {
      // Simulates old data without purchasedWithMoney or gemIncomeBreakdown
      const oldState = {
        incomes: [
          { currencyId: CurrencyId.Coins, currentBalance: 1000, weeklyIncome: 500, growthRatePercent: 5 },
          { currencyId: CurrencyId.Stones, currentBalance: 200, weeklyIncome: 100, growthRatePercent: 0 },
        ],
        stoneIncomeBreakdown: { weeklyChallenges: 60, eventStore: 0, tournamentResults: 40 },
        events: [
          { id: '1', name: 'Test', currencyId: CurrencyId.Coins, amount: 500, priority: 0 },
        ],
        timelineConfig: { weeks: 26 },
        incomePanelCollapsed: false,
        lastUpdated: Date.now(),
      }
      localStorage.setItem('tower-tracking-spending-planner', JSON.stringify(oldState))

      const loaded = loadSpendingPlannerState()
      expect(loaded.incomes[0].currentBalance).toBe(1000)
      expect(loaded.events).toHaveLength(1)
      expect(loaded.timelineConfig.weeks).toBe(26)
      // Verify migration added missing fields
      expect(loaded.stoneIncomeBreakdown.purchasedWithMoney).toBe(0)
      expect(loaded.gemIncomeBreakdown).toBeDefined()
      // Verify migration added missing currencies
      expect(loaded.incomes).toHaveLength(4)
      expect(loaded.incomes[2].currencyId).toBe(CurrencyId.RerollShards)
      expect(loaded.incomes[3].currencyId).toBe(CurrencyId.Gems)
    })

    it('should always return incomePanelCollapsed as true', () => {
      // Simulates old data structure with only 2 currencies
      const oldState = {
        incomes: [
          { currencyId: CurrencyId.Coins, currentBalance: 0, weeklyIncome: 0, growthRatePercent: 5 },
          { currencyId: CurrencyId.Stones, currentBalance: 0, weeklyIncome: 0, growthRatePercent: 0 },
        ],
        stoneIncomeBreakdown: { weeklyChallenges: 0, eventStore: 0, tournamentResults: 0 },
        events: [],
        timelineConfig: { weeks: 12 },
        incomePanelCollapsed: false,
        lastUpdated: Date.now(),
      }
      localStorage.setItem('tower-tracking-spending-planner', JSON.stringify(oldState))

      const loaded = loadSpendingPlannerState()
      expect(loaded.incomePanelCollapsed).toBe(true)
      // Also verify migration added missing currencies
      expect(loaded.incomes).toHaveLength(4)
    })

    it('should return default state for invalid JSON', () => {
      localStorage.setItem('tower-tracking-spending-planner', 'invalid json')

      const state = loadSpendingPlannerState()
      expect(state).toEqual(expect.objectContaining({ events: [] }))
    })

    it('should return default state for missing required fields', () => {
      localStorage.setItem('tower-tracking-spending-planner', JSON.stringify({ incomes: [] }))

      const state = loadSpendingPlannerState()
      expect(state.incomes).toHaveLength(4) // Falls back to default
    })

    it('should return default state for invalid currency ID', () => {
      const invalidState = {
        incomes: [
          { currencyId: 'invalid', currentBalance: 0, weeklyIncome: 0, growthRatePercent: 0 },
        ],
        stoneIncomeBreakdown: { weeklyChallenges: 0, eventStore: 0, tournamentResults: 0 },
        events: [],
        timelineConfig: { weeks: 12 },
        incomePanelCollapsed: false,
        lastUpdated: Date.now(),
      }
      localStorage.setItem('tower-tracking-spending-planner', JSON.stringify(invalidState))

      const state = loadSpendingPlannerState()
      expect(state.incomes).toHaveLength(4) // Falls back to default
    })

    it('should return default state for invalid timeline weeks', () => {
      const invalidState = {
        incomes: [
          { currencyId: 'coins', currentBalance: 0, weeklyIncome: 0, growthRatePercent: 5 },
          { currencyId: 'stones', currentBalance: 0, weeklyIncome: 0, growthRatePercent: 0 },
        ],
        stoneIncomeBreakdown: { weeklyChallenges: 0, eventStore: 0, tournamentResults: 0 },
        events: [],
        timelineConfig: { weeks: 15 }, // Invalid week count
        incomePanelCollapsed: false,
        lastUpdated: Date.now(),
      }
      localStorage.setItem('tower-tracking-spending-planner', JSON.stringify(invalidState))

      const state = loadSpendingPlannerState()
      expect(state.timelineConfig.weeks).toBe(12) // Falls back to default
    })

    it('should migrate old state without layoutMode to columns', () => {
      const oldState = {
        incomes: [
          { currencyId: CurrencyId.Coins, currentBalance: 1000, weeklyIncome: 500, growthRatePercent: 5 },
          { currencyId: CurrencyId.Stones, currentBalance: 200, weeklyIncome: 100, growthRatePercent: 0 },
        ],
        stoneIncomeBreakdown: { weeklyChallenges: 60, eventStore: 0, tournamentResults: 40 },
        events: [],
        timelineConfig: { weeks: 26 }, // No layoutMode property
        incomePanelCollapsed: false,
        lastUpdated: Date.now(),
      }
      localStorage.setItem('tower-tracking-spending-planner', JSON.stringify(oldState))

      const loaded = loadSpendingPlannerState()
      expect(loaded.timelineConfig.weeks).toBe(26)
      expect(loaded.timelineConfig.layoutMode).toBe('columns') // Migration adds default
    })

    it('should preserve existing layoutMode when loading', () => {
      const stateWithLayoutMode = {
        incomes: [
          { currencyId: CurrencyId.Coins, currentBalance: 1000, weeklyIncome: 500, growthRatePercent: 5 },
          { currencyId: CurrencyId.Stones, currentBalance: 200, weeklyIncome: 100, growthRatePercent: 0 },
        ],
        stoneIncomeBreakdown: { weeklyChallenges: 60, eventStore: 0, tournamentResults: 40 },
        events: [],
        timelineConfig: { weeks: 12, layoutMode: 'rows' },
        incomePanelCollapsed: false,
        lastUpdated: Date.now(),
      }
      localStorage.setItem('tower-tracking-spending-planner', JSON.stringify(stateWithLayoutMode))

      const loaded = loadSpendingPlannerState()
      expect(loaded.timelineConfig.layoutMode).toBe('rows')
    })

    it('should default to columns for invalid layoutMode', () => {
      const stateWithInvalidLayoutMode = {
        incomes: [
          { currencyId: CurrencyId.Coins, currentBalance: 1000, weeklyIncome: 500, growthRatePercent: 5 },
          { currencyId: CurrencyId.Stones, currentBalance: 200, weeklyIncome: 100, growthRatePercent: 0 },
        ],
        stoneIncomeBreakdown: { weeklyChallenges: 60, eventStore: 0, tournamentResults: 40 },
        events: [],
        timelineConfig: { weeks: 12, layoutMode: 'invalid' },
        incomePanelCollapsed: false,
        lastUpdated: Date.now(),
      }
      localStorage.setItem('tower-tracking-spending-planner', JSON.stringify(stateWithInvalidLayoutMode))

      const loaded = loadSpendingPlannerState()
      expect(loaded.timelineConfig.layoutMode).toBe('columns')
    })
  })

  describe('saveSpendingPlannerState', () => {
    it('should save state to localStorage', () => {
      const state = getDefaultState()
      state.incomes[0].currentBalance = 5000

      saveSpendingPlannerState(state)

      const stored = localStorage.getItem('tower-tracking-spending-planner')
      expect(stored).toBeTruthy()
      const parsed = JSON.parse(stored!)
      expect(parsed.incomes[0].currentBalance).toBe(5000)
    })

    it('should update lastUpdated timestamp', () => {
      const state = getDefaultState()
      const originalTimestamp = state.lastUpdated

      // Wait a tiny bit to ensure timestamp differs
      vi.useFakeTimers()
      vi.advanceTimersByTime(100)

      saveSpendingPlannerState(state)

      const stored = localStorage.getItem('tower-tracking-spending-planner')
      const parsed = JSON.parse(stored!)
      expect(parsed.lastUpdated).toBeGreaterThan(originalTimestamp)

      vi.useRealTimers()
    })
  })

  describe('clearSpendingPlannerState', () => {
    it('should remove state from localStorage', () => {
      const state = getDefaultState()
      saveSpendingPlannerState(state)
      expect(localStorage.getItem('tower-tracking-spending-planner')).toBeTruthy()

      clearSpendingPlannerState()
      expect(localStorage.getItem('tower-tracking-spending-planner')).toBeNull()
    })

    it('should not throw when nothing to clear', () => {
      expect(() => clearSpendingPlannerState()).not.toThrow()
    })
  })

  describe('event validation', () => {
    it('should accept events with optional durationDays', () => {
      // Simulates old data structure
      const oldState = {
        incomes: [
          { currencyId: CurrencyId.Coins, currentBalance: 0, weeklyIncome: 0, growthRatePercent: 5 },
          { currencyId: CurrencyId.Stones, currentBalance: 0, weeklyIncome: 0, growthRatePercent: 0 },
        ],
        stoneIncomeBreakdown: { weeklyChallenges: 0, eventStore: 0, tournamentResults: 0 },
        events: [
          { id: '1', name: 'Lab', currencyId: CurrencyId.Coins, amount: 500, priority: 0, durationDays: 40 },
        ],
        timelineConfig: { weeks: 12 },
        incomePanelCollapsed: false,
        lastUpdated: Date.now(),
      }
      localStorage.setItem('tower-tracking-spending-planner', JSON.stringify(oldState))

      const loaded = loadSpendingPlannerState()
      expect(loaded.events[0].durationDays).toBe(40)
    })

    it('should reject events with invalid currency', () => {
      const invalidState = {
        incomes: [
          { currencyId: 'coins', currentBalance: 0, weeklyIncome: 0, growthRatePercent: 5 },
          { currencyId: 'stones', currentBalance: 0, weeklyIncome: 0, growthRatePercent: 0 },
        ],
        stoneIncomeBreakdown: { weeklyChallenges: 0, eventStore: 0, tournamentResults: 0 },
        events: [
          { id: '1', name: 'Invalid', currencyId: 'gold', amount: 500, priority: 0 },
        ],
        timelineConfig: { weeks: 12 },
        incomePanelCollapsed: false,
        lastUpdated: Date.now(),
      }
      localStorage.setItem('tower-tracking-spending-planner', JSON.stringify(invalidState))

      const loaded = loadSpendingPlannerState()
      expect(loaded.events).toEqual([]) // Falls back to default
    })
  })
})
