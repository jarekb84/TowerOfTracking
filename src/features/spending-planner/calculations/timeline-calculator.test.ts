import { describe, it, expect } from 'vitest'
import { calculateTimeline, getWeekNumber, getWeekStartDate } from './timeline-calculator'
import { CurrencyId } from '../types'
import type { CurrencyIncome, SpendingEvent } from '../types'

/** Create a test CurrencyIncome with default derived income fields */
function createTestIncome(
  currencyId: CurrencyId,
  currentBalance: number,
  weeklyIncome: number,
  growthRatePercent: number
): CurrencyIncome {
  return {
    currencyId,
    currentBalance,
    weeklyIncome,
    growthRatePercent,
    weeklyIncomeSource: 'manual',
    growthRateSource: 'manual',
    derivedWeeklyIncome: null,
    derivedGrowthRate: null,
  }
}

describe('timeline-calculator', () => {
  // Use explicit date parts to avoid UTC parsing issues
  const startDate = new Date(2025, 0, 1) // Jan 1, 2025

  describe('calculateTimeline', () => {
    it('should schedule event in week 0 if affordable by end of week', () => {
      const incomes: CurrencyIncome[] = [
        createTestIncome(CurrencyId.Coins, 1000, 100, 0),
      ]
      const events: SpendingEvent[] = [
        { id: '1', name: 'Event 1', currencyId: CurrencyId.Coins, amount: 500, priority: 0 },
      ]

      const result = calculateTimeline(incomes, events, 12, startDate)

      expect(result.events).toHaveLength(1)
      expect(result.events[0].triggerWeek).toBe(0)
      // balanceAtTrigger is now the ending balance (start + income) = 1000 + 100 = 1100
      expect(result.events[0].balanceAtTrigger).toBe(1100)
    })

    it('should schedule event in later week when ending balance can cover it', () => {
      const incomes: CurrencyIncome[] = [
        createTestIncome(CurrencyId.Coins, 100, 100, 0),
      ]
      const events: SpendingEvent[] = [
        { id: '1', name: 'Event 1', currencyId: CurrencyId.Coins, amount: 500, priority: 0 },
      ]

      const result = calculateTimeline(incomes, events, 12, startDate)

      expect(result.events).toHaveLength(1)
      // Week 3 ending balance = 100 + 4*100 = 500 (start + 4 weeks of income)
      // Event can be purchased mid-week after receiving week 3 income
      expect(result.events[0].triggerWeek).toBe(3)
    })

    it('should process events in priority order', () => {
      const incomes: CurrencyIncome[] = [
        createTestIncome(CurrencyId.Coins, 1000, 100, 0),
      ]
      const events: SpendingEvent[] = [
        { id: '2', name: 'Event 2', currencyId: CurrencyId.Coins, amount: 300, priority: 1 },
        { id: '1', name: 'Event 1', currencyId: CurrencyId.Coins, amount: 700, priority: 0 },
      ]

      const result = calculateTimeline(incomes, events, 12, startDate)

      expect(result.events).toHaveLength(2)
      // Event 1 (priority 0) should trigger first at week 0 (1000 >= 700)
      expect(result.events[0].event.id).toBe('1')
      expect(result.events[0].triggerWeek).toBe(0)
      // Event 2 (priority 1) should trigger at week 0 since 1000-700=300 >= 300
      expect(result.events[1].event.id).toBe('2')
      expect(result.events[1].triggerWeek).toBe(0)
    })

    it('should deduct cost from future balances', () => {
      const incomes: CurrencyIncome[] = [
        createTestIncome(CurrencyId.Coins, 500, 100, 0),
      ]
      const events: SpendingEvent[] = [
        { id: '1', name: 'Event 1', currencyId: CurrencyId.Coins, amount: 400, priority: 0 },
        { id: '2', name: 'Event 2', currencyId: CurrencyId.Coins, amount: 200, priority: 1 },
      ]

      const result = calculateTimeline(incomes, events, 12, startDate)

      expect(result.events).toHaveLength(2)
      // Event 1: ending balance = 500 + 100 = 600 >= 400, triggers week 0
      expect(result.events[0].triggerWeek).toBe(0)
      // Event 2: ending balance after event 1 = 600 - 400 = 200 >= 200, also triggers week 0
      expect(result.events[1].triggerWeek).toBe(0)
    })

    it('should handle multiple currencies independently when sequence allows', () => {
      const incomes: CurrencyIncome[] = [
        createTestIncome(CurrencyId.Coins, 500, 100, 0),
        createTestIncome(CurrencyId.Stones, 200, 50, 0),
      ]
      const events: SpendingEvent[] = [
        { id: '1', name: 'Coin Event', currencyId: CurrencyId.Coins, amount: 400, priority: 0 },
        { id: '2', name: 'Stone Event', currencyId: CurrencyId.Stones, amount: 150, priority: 1 },
      ]

      const result = calculateTimeline(incomes, events, 12, startDate)

      expect(result.events).toHaveLength(2)
      expect(result.events[0].event.currencyId).toBe(CurrencyId.Coins)
      expect(result.events[0].triggerWeek).toBe(0)
      // Stone event CAN trigger at week 0 since coin event also triggered at week 0
      expect(result.events[1].event.currencyId).toBe(CurrencyId.Stones)
      expect(result.events[1].triggerWeek).toBe(0)
    })

    it('should enforce queue sequence - later events cannot trigger before earlier ones', () => {
      const incomes: CurrencyIncome[] = [
        createTestIncome(CurrencyId.Coins, 100, 100, 0),
        createTestIncome(CurrencyId.Stones, 500, 50, 0),
      ]
      // Event 1 (coins) can't afford until week 3 (ending balance = 500)
      // Event 2 (stones) COULD afford immediately at week 0
      // But Event 2 should wait for Event 1 due to queue sequence
      const events: SpendingEvent[] = [
        { id: '1', name: 'Coin Event', currencyId: CurrencyId.Coins, amount: 500, priority: 0 },
        { id: '2', name: 'Stone Event', currencyId: CurrencyId.Stones, amount: 100, priority: 1 },
      ]

      const result = calculateTimeline(incomes, events, 12, startDate)

      expect(result.events).toHaveLength(2)
      // Coin event triggers at week 3 (ending balance = 100 + 4*100 = 500)
      expect(result.events[0].triggerWeek).toBe(3)
      // Stone event must wait until week 3 even though balance allows week 0
      expect(result.events[1].triggerWeek).toBe(3)
    })

    it('should mark events as unaffordable if cannot be afforded within timeline', () => {
      const incomes: CurrencyIncome[] = [
        createTestIncome(CurrencyId.Coins, 100, 10, 0),
      ]
      const events: SpendingEvent[] = [
        { id: '1', name: 'Expensive Event', currencyId: CurrencyId.Coins, amount: 10000, priority: 0 },
      ]

      const result = calculateTimeline(incomes, events, 12, startDate)

      expect(result.events).toHaveLength(0)
      expect(result.unaffordableEvents).toHaveLength(1)
      expect(result.unaffordableEvents[0].id).toBe('1')
    })

    it('should calculate correct trigger dates', () => {
      const incomes: CurrencyIncome[] = [
        createTestIncome(CurrencyId.Coins, 100, 100, 0),
      ]
      const events: SpendingEvent[] = [
        { id: '1', name: 'Event', currencyId: CurrencyId.Coins, amount: 300, priority: 0 },
      ]

      const result = calculateTimeline(incomes, events, 12, startDate)

      expect(result.events).toHaveLength(1)
      // Week 1 ending balance = 100 + 2*100 = 300, can afford mid-week
      expect(result.events[0].triggerWeek).toBe(1)
      // 1 week after Jan 1 = Jan 8
      expect(result.events[0].triggerDate.getDate()).toBe(8)
    })

    it('should calculate end dates for events with duration', () => {
      const incomes: CurrencyIncome[] = [
        createTestIncome(CurrencyId.Coins, 1000, 100, 0),
      ]
      const events: SpendingEvent[] = [
        { id: '1', name: 'Lab', currencyId: CurrencyId.Coins, amount: 500, priority: 0, durationDays: 40 },
      ]

      const result = calculateTimeline(incomes, events, 12, startDate)

      expect(result.events).toHaveLength(1)
      expect(result.events[0].endDate).toBeDefined()
      // 40 days after Jan 1 = Feb 10
      const expectedEnd = new Date(startDate)
      expectedEnd.setDate(expectedEnd.getDate() + 40)
      expect(result.events[0].endDate!.getDate()).toBe(expectedEnd.getDate())
    })

    it('should include balance projections in result', () => {
      const incomes: CurrencyIncome[] = [
        createTestIncome(CurrencyId.Coins, 100, 50, 0),
      ]
      const events: SpendingEvent[] = []

      const result = calculateTimeline(incomes, events, 4, startDate)

      const coinBalances = result.balancesByWeek.get(CurrencyId.Coins)
      expect(coinBalances).toBeDefined()
      expect(coinBalances).toEqual([100, 150, 200, 250, 300])
    })

    it('should include income projections in result', () => {
      const incomes: CurrencyIncome[] = [
        createTestIncome(CurrencyId.Coins, 100, 50, 0),
      ]
      const events: SpendingEvent[] = []

      const result = calculateTimeline(incomes, events, 4, startDate)

      const coinIncomes = result.incomeByWeek.get(CurrencyId.Coins)
      expect(coinIncomes).toBeDefined()
      expect(coinIncomes).toEqual([50, 50, 50, 50])
    })

    it('should include expenditure tracking in result with no events', () => {
      const incomes: CurrencyIncome[] = [
        createTestIncome(CurrencyId.Coins, 100, 50, 0),
      ]
      const events: SpendingEvent[] = []

      const result = calculateTimeline(incomes, events, 4, startDate)

      const coinExpenditures = result.expenditureByWeek.get(CurrencyId.Coins)
      expect(coinExpenditures).toBeDefined()
      expect(coinExpenditures).toEqual([0, 0, 0, 0])
    })

    it('should track expenditure in the correct week', () => {
      const incomes: CurrencyIncome[] = [
        createTestIncome(CurrencyId.Coins, 100, 100, 0),
      ]
      const events: SpendingEvent[] = [
        { id: '1', name: 'Event 1', currencyId: CurrencyId.Coins, amount: 300, priority: 0 },
      ]

      const result = calculateTimeline(incomes, events, 4, startDate)

      const coinExpenditures = result.expenditureByWeek.get(CurrencyId.Coins)
      expect(coinExpenditures).toBeDefined()
      // Event triggers at week 1 (ending balance = 100 + 2*100 = 300)
      expect(coinExpenditures).toEqual([0, 300, 0, 0])
    })

    it('should accumulate multiple expenditures in the same week', () => {
      const incomes: CurrencyIncome[] = [
        createTestIncome(CurrencyId.Coins, 1000, 100, 0),
      ]
      const events: SpendingEvent[] = [
        { id: '1', name: 'Event 1', currencyId: CurrencyId.Coins, amount: 200, priority: 0 },
        { id: '2', name: 'Event 2', currencyId: CurrencyId.Coins, amount: 300, priority: 1 },
      ]

      const result = calculateTimeline(incomes, events, 4, startDate)

      const coinExpenditures = result.expenditureByWeek.get(CurrencyId.Coins)
      expect(coinExpenditures).toBeDefined()
      // Both events trigger at week 0 since balance is 1000
      expect(coinExpenditures).toEqual([500, 0, 0, 0])
    })

    it('should track expenditures across different weeks', () => {
      const incomes: CurrencyIncome[] = [
        createTestIncome(CurrencyId.Coins, 500, 200, 0),
      ]
      const events: SpendingEvent[] = [
        { id: '1', name: 'Event 1', currencyId: CurrencyId.Coins, amount: 400, priority: 0 },
        { id: '2', name: 'Event 2', currencyId: CurrencyId.Coins, amount: 500, priority: 1 },
      ]

      const result = calculateTimeline(incomes, events, 4, startDate)

      const coinExpenditures = result.expenditureByWeek.get(CurrencyId.Coins)
      expect(coinExpenditures).toBeDefined()
      // Event 1: week 0 (ending balance = 500 + 200 = 700 >= 400)
      // After deduction: ending balance = 300
      // Event 2: week 1 (ending balance after event 1 = 300 + 200 = 500 >= 500)
      expect(coinExpenditures).toEqual([400, 500, 0, 0])
    })

    it('should track expenditures for multiple currencies', () => {
      const incomes: CurrencyIncome[] = [
        createTestIncome(CurrencyId.Coins, 500, 100, 0),
        createTestIncome(CurrencyId.Stones, 100, 50, 0),
      ]
      const events: SpendingEvent[] = [
        { id: '1', name: 'Coin Event', currencyId: CurrencyId.Coins, amount: 300, priority: 0 },
        { id: '2', name: 'Stone Event', currencyId: CurrencyId.Stones, amount: 75, priority: 1 },
      ]

      const result = calculateTimeline(incomes, events, 4, startDate)

      const coinExpenditures = result.expenditureByWeek.get(CurrencyId.Coins)
      const stoneExpenditures = result.expenditureByWeek.get(CurrencyId.Stones)

      expect(coinExpenditures).toEqual([300, 0, 0, 0])
      expect(stoneExpenditures).toEqual([75, 0, 0, 0])
    })
  })

  describe('getWeekNumber', () => {
    it('should return 0 for same date', () => {
      const date = new Date(2025, 0, 1)
      expect(getWeekNumber(date, startDate)).toBe(0)
    })

    it('should return correct week for later date', () => {
      const date = new Date(2025, 0, 15) // 14 days = 2 weeks
      expect(getWeekNumber(date, startDate)).toBe(2)
    })

    it('should handle partial weeks', () => {
      const date = new Date(2025, 0, 5) // 4 days = still week 0
      expect(getWeekNumber(date, startDate)).toBe(0)
    })
  })

  describe('getWeekStartDate', () => {
    it('should return start date for week 0', () => {
      const result = getWeekStartDate(0, startDate)
      expect(result.getTime()).toBe(startDate.getTime())
    })

    it('should return correct date for later weeks', () => {
      const result = getWeekStartDate(2, startDate)
      expect(result.getDate()).toBe(15) // Jan 1 + 14 days = Jan 15
    })
  })
})
