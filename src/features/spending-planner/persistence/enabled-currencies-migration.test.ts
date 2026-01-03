import { describe, it, expect, beforeEach } from 'vitest'
import { loadSpendingPlannerState } from './spending-planner-persistence'
import { CurrencyId } from '../types'

describe('enabledCurrencies migration', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should migrate old state without enabledCurrencies to have all currencies enabled', () => {
    const oldState = {
      incomes: [
        { currencyId: CurrencyId.Coins, currentBalance: 1000, weeklyIncome: 500, growthRatePercent: 5 },
        { currencyId: CurrencyId.Stones, currentBalance: 200, weeklyIncome: 100, growthRatePercent: 0 },
        { currencyId: CurrencyId.RerollShards, currentBalance: 0, weeklyIncome: 0, growthRatePercent: 0 },
        { currencyId: CurrencyId.Gems, currentBalance: 0, weeklyIncome: 0, growthRatePercent: 0 },
      ],
      stoneIncomeBreakdown: { weeklyChallenges: 60, eventStore: 0, tournamentResults: 40, purchasedWithMoney: 0 },
      gemIncomeBreakdown: {
        adGems: 0, floatingGems: 0, storeDailyGems: 0, storeWeeklyGems: 0,
        missionsDailyCompletion: 0, missionsWeeklyChests: 0, tournaments: 0,
        biweeklyEventShop: 0, guildWeeklyChests: 0, guildSeasonalStore: 0,
        offerWalls: 0, purchasedWithMoney: 0,
      },
      events: [],
      timelineConfig: { weeks: 12 },
      incomePanelCollapsed: false,
      lastUpdated: Date.now(),
      // Note: no enabledCurrencies field
    }
    localStorage.setItem('tower-tracking-spending-planner', JSON.stringify(oldState))

    const loaded = loadSpendingPlannerState()
    expect(loaded.enabledCurrencies).toEqual([
      CurrencyId.Coins,
      CurrencyId.Stones,
      CurrencyId.RerollShards,
      CurrencyId.Gems,
    ])
  })

  it('should preserve existing enabledCurrencies when present', () => {
    const stateWithEnabledCurrencies = {
      incomes: [
        { currencyId: CurrencyId.Coins, currentBalance: 0, weeklyIncome: 0, growthRatePercent: 5 },
        { currencyId: CurrencyId.Stones, currentBalance: 0, weeklyIncome: 0, growthRatePercent: 0 },
        { currencyId: CurrencyId.RerollShards, currentBalance: 0, weeklyIncome: 0, growthRatePercent: 0 },
        { currencyId: CurrencyId.Gems, currentBalance: 0, weeklyIncome: 0, growthRatePercent: 0 },
      ],
      stoneIncomeBreakdown: { weeklyChallenges: 0, eventStore: 0, tournamentResults: 0, purchasedWithMoney: 0 },
      gemIncomeBreakdown: {
        adGems: 0, floatingGems: 0, storeDailyGems: 0, storeWeeklyGems: 0,
        missionsDailyCompletion: 0, missionsWeeklyChests: 0, tournaments: 0,
        biweeklyEventShop: 0, guildWeeklyChests: 0, guildSeasonalStore: 0,
        offerWalls: 0, purchasedWithMoney: 0,
      },
      events: [],
      timelineConfig: { weeks: 12 },
      incomePanelCollapsed: false,
      enabledCurrencies: [CurrencyId.Coins, CurrencyId.Gems],
      lastUpdated: Date.now(),
    }
    localStorage.setItem('tower-tracking-spending-planner', JSON.stringify(stateWithEnabledCurrencies))

    const loaded = loadSpendingPlannerState()
    expect(loaded.enabledCurrencies).toEqual([CurrencyId.Coins, CurrencyId.Gems])
  })

  it('should filter out invalid currency IDs from enabledCurrencies', () => {
    const stateWithInvalidCurrencies = {
      incomes: [
        { currencyId: CurrencyId.Coins, currentBalance: 0, weeklyIncome: 0, growthRatePercent: 5 },
        { currencyId: CurrencyId.Stones, currentBalance: 0, weeklyIncome: 0, growthRatePercent: 0 },
        { currencyId: CurrencyId.RerollShards, currentBalance: 0, weeklyIncome: 0, growthRatePercent: 0 },
        { currencyId: CurrencyId.Gems, currentBalance: 0, weeklyIncome: 0, growthRatePercent: 0 },
      ],
      stoneIncomeBreakdown: { weeklyChallenges: 0, eventStore: 0, tournamentResults: 0, purchasedWithMoney: 0 },
      gemIncomeBreakdown: {
        adGems: 0, floatingGems: 0, storeDailyGems: 0, storeWeeklyGems: 0,
        missionsDailyCompletion: 0, missionsWeeklyChests: 0, tournaments: 0,
        biweeklyEventShop: 0, guildWeeklyChests: 0, guildSeasonalStore: 0,
        offerWalls: 0, purchasedWithMoney: 0,
      },
      events: [],
      timelineConfig: { weeks: 12 },
      incomePanelCollapsed: false,
      enabledCurrencies: [CurrencyId.Coins, 'invalid', CurrencyId.Gems],
      lastUpdated: Date.now(),
    }
    localStorage.setItem('tower-tracking-spending-planner', JSON.stringify(stateWithInvalidCurrencies))

    const loaded = loadSpendingPlannerState()
    expect(loaded.enabledCurrencies).toEqual([CurrencyId.Coins, CurrencyId.Gems])
  })

  it('should default to all currencies when enabledCurrencies is empty after filtering', () => {
    const stateWithAllInvalidCurrencies = {
      incomes: [
        { currencyId: CurrencyId.Coins, currentBalance: 0, weeklyIncome: 0, growthRatePercent: 5 },
        { currencyId: CurrencyId.Stones, currentBalance: 0, weeklyIncome: 0, growthRatePercent: 0 },
        { currencyId: CurrencyId.RerollShards, currentBalance: 0, weeklyIncome: 0, growthRatePercent: 0 },
        { currencyId: CurrencyId.Gems, currentBalance: 0, weeklyIncome: 0, growthRatePercent: 0 },
      ],
      stoneIncomeBreakdown: { weeklyChallenges: 0, eventStore: 0, tournamentResults: 0, purchasedWithMoney: 0 },
      gemIncomeBreakdown: {
        adGems: 0, floatingGems: 0, storeDailyGems: 0, storeWeeklyGems: 0,
        missionsDailyCompletion: 0, missionsWeeklyChests: 0, tournaments: 0,
        biweeklyEventShop: 0, guildWeeklyChests: 0, guildSeasonalStore: 0,
        offerWalls: 0, purchasedWithMoney: 0,
      },
      events: [],
      timelineConfig: { weeks: 12 },
      incomePanelCollapsed: false,
      enabledCurrencies: ['invalid1', 'invalid2'],
      lastUpdated: Date.now(),
    }
    localStorage.setItem('tower-tracking-spending-planner', JSON.stringify(stateWithAllInvalidCurrencies))

    const loaded = loadSpendingPlannerState()
    expect(loaded.enabledCurrencies).toEqual([
      CurrencyId.Coins,
      CurrencyId.Stones,
      CurrencyId.RerollShards,
      CurrencyId.Gems,
    ])
  })
})
