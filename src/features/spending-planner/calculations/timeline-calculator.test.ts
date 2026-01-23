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
        { id: '1', name: 'Event 1', currencyId: CurrencyId.Coins, amount: 500, priority: 0, lockedToEventId: null },
      ]

      const result = calculateTimeline(incomes, events, 12, { startDate })

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
        { id: '1', name: 'Event 1', currencyId: CurrencyId.Coins, amount: 500, priority: 0, lockedToEventId: null },
      ]

      const result = calculateTimeline(incomes, events, 12, { startDate })

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
        { id: '2', name: 'Event 2', currencyId: CurrencyId.Coins, amount: 300, priority: 1, lockedToEventId: null },
        { id: '1', name: 'Event 1', currencyId: CurrencyId.Coins, amount: 700, priority: 0, lockedToEventId: null },
      ]

      const result = calculateTimeline(incomes, events, 12, { startDate })

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
        { id: '1', name: 'Event 1', currencyId: CurrencyId.Coins, amount: 400, priority: 0, lockedToEventId: null },
        { id: '2', name: 'Event 2', currencyId: CurrencyId.Coins, amount: 200, priority: 1, lockedToEventId: null },
      ]

      const result = calculateTimeline(incomes, events, 12, { startDate })

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
        { id: '1', name: 'Coin Event', currencyId: CurrencyId.Coins, amount: 400, priority: 0, lockedToEventId: null },
        { id: '2', name: 'Stone Event', currencyId: CurrencyId.Stones, amount: 150, priority: 1, lockedToEventId: null },
      ]

      const result = calculateTimeline(incomes, events, 12, { startDate })

      expect(result.events).toHaveLength(2)
      expect(result.events[0].event.currencyId).toBe(CurrencyId.Coins)
      expect(result.events[0].triggerWeek).toBe(0)
      // Stone event CAN trigger at week 0 since coin event also triggered at week 0
      expect(result.events[1].event.currencyId).toBe(CurrencyId.Stones)
      expect(result.events[1].triggerWeek).toBe(0)
    })

    it('should allow free-floating events to trigger independently', () => {
      const incomes: CurrencyIncome[] = [
        createTestIncome(CurrencyId.Coins, 100, 100, 0),
        createTestIncome(CurrencyId.Stones, 500, 50, 0),
      ]
      // Event 1 (coins) can't afford until week 3 (ending balance = 500)
      // Event 2 (stones) CAN afford immediately at week 0
      // Free-floating events can trigger as soon as balance allows
      const events: SpendingEvent[] = [
        { id: '1', name: 'Coin Event', currencyId: CurrencyId.Coins, amount: 500, priority: 0, lockedToEventId: null },
        { id: '2', name: 'Stone Event', currencyId: CurrencyId.Stones, amount: 100, priority: 1, lockedToEventId: null },
      ]

      const result = calculateTimeline(incomes, events, 12, { startDate })

      expect(result.events).toHaveLength(2)
      // Coin event triggers at week 3 (ending balance = 100 + 4*100 = 500)
      expect(result.events[0].triggerWeek).toBe(3)
      // Stone event triggers at week 0 since it's free-floating and balance allows
      expect(result.events[1].triggerWeek).toBe(0)
    })

    it('should enforce chained event sequence - chained events wait for predecessor', () => {
      const incomes: CurrencyIncome[] = [
        createTestIncome(CurrencyId.Coins, 100, 100, 0),
        createTestIncome(CurrencyId.Stones, 500, 50, 0),
      ]
      // Event 1 (coins) can't afford until week 3 (ending balance = 500)
      // Event 2 (stones) COULD afford immediately at week 0
      // But Event 2 is chained to Event 1, so it must wait
      const events: SpendingEvent[] = [
        { id: '1', name: 'Coin Event', currencyId: CurrencyId.Coins, amount: 500, priority: 0, lockedToEventId: null },
        { id: '2', name: 'Stone Event', currencyId: CurrencyId.Stones, amount: 100, priority: 1, lockedToEventId: '1' },
      ]

      const result = calculateTimeline(incomes, events, 12, { startDate })

      expect(result.events).toHaveLength(2)
      // Coin event triggers at week 3 (ending balance = 100 + 4*100 = 500)
      expect(result.events[0].triggerWeek).toBe(3)
      // Stone event must wait until week 3 because it's chained to Event 1
      expect(result.events[1].triggerWeek).toBe(3)
    })

    it('should mark events as unaffordable if cannot be afforded within timeline', () => {
      const incomes: CurrencyIncome[] = [
        createTestIncome(CurrencyId.Coins, 100, 10, 0),
      ]
      const events: SpendingEvent[] = [
        { id: '1', name: 'Expensive Event', currencyId: CurrencyId.Coins, amount: 10000, priority: 0, lockedToEventId: null },
      ]

      const result = calculateTimeline(incomes, events, 12, { startDate })

      expect(result.events).toHaveLength(0)
      expect(result.unaffordableEvents).toHaveLength(1)
      expect(result.unaffordableEvents[0].id).toBe('1')
    })

    it('should calculate correct trigger dates', () => {
      const incomes: CurrencyIncome[] = [
        createTestIncome(CurrencyId.Coins, 100, 100, 0),
      ]
      const events: SpendingEvent[] = [
        { id: '1', name: 'Event', currencyId: CurrencyId.Coins, amount: 300, priority: 0, lockedToEventId: null },
      ]

      const result = calculateTimeline(incomes, events, 12, { startDate })

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
        { id: '1', name: 'Lab', currencyId: CurrencyId.Coins, amount: 500, priority: 0, durationDays: 40, lockedToEventId: null },
      ]

      const result = calculateTimeline(incomes, events, 12, { startDate })

      expect(result.events).toHaveLength(1)
      expect(result.events[0].endDate).toBeDefined()
      // 40 days after Jan 1 = Feb 10
      const expectedEnd = new Date(startDate)
      expectedEnd.setDate(expectedEnd.getDate() + 40)
      expect(result.events[0].endDate!.getDate()).toBe(expectedEnd.getDate())
    })

    it('should include balance, income, and expenditure projections in result', () => {
      const incomes: CurrencyIncome[] = [createTestIncome(CurrencyId.Coins, 100, 50, 0)]
      const result = calculateTimeline(incomes, [], 4, { startDate })

      expect(result.balancesByWeek.get(CurrencyId.Coins)).toEqual([100, 150, 200, 250, 300])
      expect(result.incomeByWeek.get(CurrencyId.Coins)).toEqual([50, 50, 50, 50])
      expect(result.expenditureByWeek.get(CurrencyId.Coins)).toEqual([0, 0, 0, 0])
    })

    it('should track expenditure in the correct week', () => {
      const incomes: CurrencyIncome[] = [
        createTestIncome(CurrencyId.Coins, 100, 100, 0),
      ]
      const events: SpendingEvent[] = [
        { id: '1', name: 'Event 1', currencyId: CurrencyId.Coins, amount: 300, priority: 0, lockedToEventId: null },
      ]

      const result = calculateTimeline(incomes, events, 4, { startDate })

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
        { id: '1', name: 'Event 1', currencyId: CurrencyId.Coins, amount: 200, priority: 0, lockedToEventId: null },
        { id: '2', name: 'Event 2', currencyId: CurrencyId.Coins, amount: 300, priority: 1, lockedToEventId: null },
      ]

      const result = calculateTimeline(incomes, events, 4, { startDate })

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
        { id: '1', name: 'Event 1', currencyId: CurrencyId.Coins, amount: 400, priority: 0, lockedToEventId: null },
        { id: '2', name: 'Event 2', currencyId: CurrencyId.Coins, amount: 500, priority: 1, lockedToEventId: null },
      ]

      const result = calculateTimeline(incomes, events, 4, { startDate })

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
        { id: '1', name: 'Coin Event', currencyId: CurrencyId.Coins, amount: 300, priority: 0, lockedToEventId: null },
        { id: '2', name: 'Stone Event', currencyId: CurrencyId.Stones, amount: 75, priority: 1, lockedToEventId: null },
      ]

      const result = calculateTimeline(incomes, events, 4, { startDate })

      const coinExpenditures = result.expenditureByWeek.get(CurrencyId.Coins)
      const stoneExpenditures = result.expenditureByWeek.get(CurrencyId.Stones)

      expect(coinExpenditures).toEqual([300, 0, 0, 0])
      expect(stoneExpenditures).toEqual([75, 0, 0, 0])
    })
  })

  describe('week 0 proration', () => {
    it('should delay event when prorated income is insufficient for week 0', () => {
      // Bug fix: With proration, balances should reflect actual available income
      // Starting: 499, Full income: 446, Cost: 750
      // Without proration: 499 + 446 = 945 >= 750, triggers week 0 (WRONG)
      // With 50% proration: 499 + 223 = 722 < 750, should delay to week 1
      const incomes: CurrencyIncome[] = [
        createTestIncome(CurrencyId.Stones, 499, 446, 0),
      ]
      const events: SpendingEvent[] = [
        { id: '1', name: 'Expensive Event', currencyId: CurrencyId.Stones, amount: 750, priority: 0, lockedToEventId: null },
      ]

      const result = calculateTimeline(incomes, events, 4, { startDate, week0ProrationFactor: 0.5 })
      expect(result.events).toHaveLength(1)
      expect(result.events[0].triggerWeek).toBe(1) // Delayed due to insufficient prorated income
    })

    it('should allow event in week 0 when prorated income is sufficient', () => {
      // Starting: 500, Full income: 500, Cost: 700 → With 50%: 500 + 250 = 750 >= 700
      const incomes: CurrencyIncome[] = [createTestIncome(CurrencyId.Stones, 500, 500, 0)]
      const events: SpendingEvent[] = [
        { id: '1', name: 'Affordable Event', currencyId: CurrencyId.Stones, amount: 700, priority: 0, lockedToEventId: null },
      ]
      const result = calculateTimeline(incomes, events, 4, { startDate, week0ProrationFactor: 0.5 })
      expect(result.events).toHaveLength(1)
      expect(result.events[0].triggerWeek).toBe(0)
    })

    it('should use full income when proration factor is 1', () => {
      // Starting: 499, Full income: 446 → 499 + 446 = 945 >= 750
      const incomes: CurrencyIncome[] = [createTestIncome(CurrencyId.Stones, 499, 446, 0)]
      const events: SpendingEvent[] = [
        { id: '1', name: 'Event', currencyId: CurrencyId.Stones, amount: 750, priority: 0, lockedToEventId: null },
      ]
      const result = calculateTimeline(incomes, events, 4, { startDate, week0ProrationFactor: 1 })
      expect(result.events).toHaveLength(1)
      expect(result.events[0].triggerWeek).toBe(0)
    })

    it('should never result in negative ending balance for week 0', () => {
      // Starting: 499, Full: 446, Cost: 750 → With 50%: 499 + 223 = 722 < 750
      const incomes: CurrencyIncome[] = [createTestIncome(CurrencyId.Stones, 499, 446, 0)]
      const events: SpendingEvent[] = [
        { id: '1', name: 'Expensive Event', currencyId: CurrencyId.Stones, amount: 750, priority: 0, lockedToEventId: null },
      ]
      const result = calculateTimeline(incomes, events, 4, { startDate, week0ProrationFactor: 0.5 })
      expect(result.events[0].triggerWeek).toBe(1)
      const balances = result.balancesByWeek.get(CurrencyId.Stones)!
      expect(balances[1]).toBeCloseTo(499 + 446 * 0.5, 5) // 722
      expect(balances[1]).toBeGreaterThan(0)
    })

    it('should correctly handle edge case with small proration factors', () => {
      // Starting: 100, Full: 1000 → With 10%: 100 + 100 = 200 >= 200
      const incomes: CurrencyIncome[] = [createTestIncome(CurrencyId.Coins, 100, 1000, 0)]
      const events: SpendingEvent[] = [
        { id: '1', name: 'Event', currencyId: CurrencyId.Coins, amount: 200, priority: 0, lockedToEventId: null },
      ]
      const result = calculateTimeline(incomes, events, 4, { startDate, week0ProrationFactor: 0.1 })
      expect(result.events).toHaveLength(1)
      expect(result.events[0].triggerWeek).toBe(0) // Just affordable
    })

    it('should delay event when just barely unaffordable with proration', () => {
      // Starting: 100, Full: 1000, Cost: 201 → With 10%: 100 + 100 = 200 < 201
      const incomes: CurrencyIncome[] = [createTestIncome(CurrencyId.Coins, 100, 1000, 0)]
      const events: SpendingEvent[] = [
        { id: '1', name: 'Event', currencyId: CurrencyId.Coins, amount: 201, priority: 0, lockedToEventId: null },
      ]
      const result = calculateTimeline(incomes, events, 4, { startDate, week0ProrationFactor: 0.1 })
      expect(result.events).toHaveLength(1)
      expect(result.events[0].triggerWeek).toBe(1)
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

  describe('event chaining', () => {
    it('should allow free-floating events to trigger based on balance only', () => {
      const incomes: CurrencyIncome[] = [
        createTestIncome(CurrencyId.Coins, 100, 100, 0),
        createTestIncome(CurrencyId.Stones, 500, 50, 0),
      ]
      // Two free-floating events - different currencies
      // Coin event needs to wait, Stone event can trigger immediately
      const events: SpendingEvent[] = [
        { id: '1', name: 'Coin Event', currencyId: CurrencyId.Coins, amount: 500, priority: 0, lockedToEventId: null },
        { id: '2', name: 'Stone Event', currencyId: CurrencyId.Stones, amount: 100, priority: 1, lockedToEventId: null },
      ]

      const result = calculateTimeline(incomes, events, 12, { startDate })

      expect(result.events).toHaveLength(2)
      // Coin event triggers at week 3 (ending balance = 100 + 4*100 = 500)
      expect(result.events[0].triggerWeek).toBe(3)
      // Stone event is free-floating so can trigger at week 0 (balance = 550 >= 100)
      expect(result.events[1].triggerWeek).toBe(0)
    })

    it('should make chained events wait for predecessor', () => {
      const incomes: CurrencyIncome[] = [
        createTestIncome(CurrencyId.Coins, 100, 100, 0),
        createTestIncome(CurrencyId.Stones, 500, 50, 0),
      ]
      // Stone event is chained to Coin event - must wait for Coin event
      const events: SpendingEvent[] = [
        { id: '1', name: 'Coin Event', currencyId: CurrencyId.Coins, amount: 500, priority: 0, lockedToEventId: null },
        { id: '2', name: 'Stone Event', currencyId: CurrencyId.Stones, amount: 100, priority: 1, lockedToEventId: '1' },
      ]

      const result = calculateTimeline(incomes, events, 12, { startDate })

      expect(result.events).toHaveLength(2)
      // Coin event triggers at week 3
      expect(result.events[0].triggerWeek).toBe(3)
      // Stone event is chained, so must wait until at least week 3
      expect(result.events[1].triggerWeek).toBe(3)
    })

    it('should handle multi-level chains correctly', () => {
      const incomes: CurrencyIncome[] = [
        createTestIncome(CurrencyId.Coins, 1000, 100, 0),
      ]
      // Three events in a chain: A -> B -> C
      const events: SpendingEvent[] = [
        { id: '1', name: 'Event A', currencyId: CurrencyId.Coins, amount: 400, priority: 0, lockedToEventId: null },
        { id: '2', name: 'Event B', currencyId: CurrencyId.Coins, amount: 400, priority: 1, lockedToEventId: '1' },
        { id: '3', name: 'Event C', currencyId: CurrencyId.Coins, amount: 400, priority: 2, lockedToEventId: '2' },
      ]

      const result = calculateTimeline(incomes, events, 12, { startDate })

      expect(result.events).toHaveLength(3)
      // Event A: week 0 (1100 >= 400)
      expect(result.events[0].triggerWeek).toBe(0)
      // Event B: must wait for A, and balance after A = 700, so week 0 still works (700 >= 400)
      expect(result.events[1].triggerWeek).toBe(0)
      // Event C: must wait for B, and balance after A+B = 300, need to wait
      // Week 0 balance: 300, Week 1: 400 >= 400
      expect(result.events[2].triggerWeek).toBe(1)
    })

    it('should handle mixed chained and free-floating events with same-currency queueing', () => {
      const incomes: CurrencyIncome[] = [
        createTestIncome(CurrencyId.Coins, 100, 100, 0),
        createTestIncome(CurrencyId.Stones, 200, 50, 0),
      ]
      // Event 1 (coins) - free-floating, needs week 3
      // Event 2 (stones) - chained to 1, has enough balance but must wait
      // Event 3 (coins) - free-floating, same currency as Event 1, must wait for it
      const events: SpendingEvent[] = [
        { id: '1', name: 'Coin Event 1', currencyId: CurrencyId.Coins, amount: 500, priority: 0, lockedToEventId: null },
        { id: '2', name: 'Stone Event', currencyId: CurrencyId.Stones, amount: 100, priority: 1, lockedToEventId: '1' },
        { id: '3', name: 'Coin Event 2', currencyId: CurrencyId.Coins, amount: 150, priority: 2, lockedToEventId: null },
      ]

      const result = calculateTimeline(incomes, events, 12, { startDate })

      expect(result.events).toHaveLength(3)
      // Event 1: week 3 (100 + 4*100 = 500)
      expect(result.events[0].triggerWeek).toBe(3)
      // Event 2: chained, must wait until week 3 despite having balance
      expect(result.events[1].triggerWeek).toBe(3)
      // Event 3: same-currency queueing - must wait for Event 1 (coins) to trigger first
      // Week 3 ending balance after Event 1: 500 - 500 = 0, plus income = 100
      // Need to wait until balance recovers: week 3 + 1 = week 4 or later for 150
      expect(result.events[2].triggerWeek).toBeGreaterThanOrEqual(3)
    })

    it('should allow different currency events to trigger independently', () => {
      const incomes: CurrencyIncome[] = [
        createTestIncome(CurrencyId.Coins, 100, 100, 0),
        createTestIncome(CurrencyId.Stones, 500, 50, 0),
      ]
      // Coins event needs to wait, Stones event can trigger immediately
      // Different currencies are independent - no queueing constraint
      const events: SpendingEvent[] = [
        { id: '1', name: 'Coin Event', currencyId: CurrencyId.Coins, amount: 500, priority: 0, lockedToEventId: null },
        { id: '2', name: 'Stone Event', currencyId: CurrencyId.Stones, amount: 100, priority: 1, lockedToEventId: null },
      ]

      const result = calculateTimeline(incomes, events, 12, { startDate })

      expect(result.events).toHaveLength(2)
      // Coins event needs week 3 (100 + 4*100 = 500)
      expect(result.events[0].triggerWeek).toBe(3)
      // Stones event triggers immediately - different currency, no queueing
      expect(result.events[1].triggerWeek).toBe(0)
    })

    it('should treat invalid chain references as free-floating', () => {
      const incomes: CurrencyIncome[] = [
        createTestIncome(CurrencyId.Coins, 500, 100, 0),
      ]
      // Event with reference to non-existent event
      const events: SpendingEvent[] = [
        { id: '1', name: 'Event A', currencyId: CurrencyId.Coins, amount: 400, priority: 0, lockedToEventId: 'non-existent' },
      ]

      const result = calculateTimeline(incomes, events, 12, { startDate })

      expect(result.events).toHaveLength(1)
      // Should trigger at week 0 since invalid reference defaults to minTriggerWeek = 0
      expect(result.events[0].triggerWeek).toBe(0)
    })
  })

  describe('user scenario: priority queue violation bug', () => {
    /**
     * BUG REPRODUCTION: User's exact localStorage data
     *
     * This test documents a bug where same-currency events can trigger out of priority order.
     * Lower priority events can "jump the queue" if they happen to be affordable while
     * higher priority events are still waiting for sufficient balance.
     *
     * User's localStorage data:
     * - incomes: coins (1T balance, 406T/week), stones (499, 260/week), rerollShards (1.51M, 232K/week), gems (582, 1916/week)
     * - events: 12 total events across multiple currencies with chaining
     *
     * BUGS OBSERVED:
     * 1. RerollShards: Roll PC (priority 3) triggers week 0, Roll Armor (priority 5, 500K) triggers week 0,
     *    but Roll DimCore (priority 4, 960K) triggers week 1 with NEGATIVE balance.
     *    Priority 5 event should NOT trigger before priority 4 event within the same currency.
     *
     * 2. Coins: WS+ Health (priority 11, 222T) triggers week 0, while RPC+ (priority 9) and
     *    Shatter Shards (priority 10) are still waiting. Free-floating events with lower priority
     *    are skipping ahead of higher priority events within the same currency.
     */

    /** User's exact income data from localStorage */
    const userIncomes: CurrencyIncome[] = [
      createTestIncome(CurrencyId.Coins, 1000000000000, 405996470000000, 10), // 1T balance, 406T/week
      createTestIncome(CurrencyId.Stones, 499, 260, 0),
      createTestIncome(CurrencyId.RerollShards, 1510000, 232627, 0.6), // 1.51M balance, ~233K/week
      createTestIncome(CurrencyId.Gems, 582, 1916, 0),
    ]

    /** User's exact events from localStorage */
    const userEvents: SpendingEvent[] = [
      { id: '1', name: 'Unlock DMG+', currencyId: CurrencyId.Stones, amount: 750, priority: 0, lockedToEventId: null },
      { id: '2', name: 'DMG+ lvl 0->1', currencyId: CurrencyId.Coins, amount: 965000000000000, durationDays: 2, priority: 1, lockedToEventId: '1' },
      { id: '3', name: 'DMG+ lvl 1->2', currencyId: CurrencyId.Coins, amount: 1140000000000000, durationDays: 3, priority: 2, lockedToEventId: '2' },
      { id: '4', name: 'Roll PC', currencyId: CurrencyId.RerollShards, amount: 800000, priority: 3, lockedToEventId: null },
      { id: '5', name: 'Roll DimCore', currencyId: CurrencyId.RerollShards, amount: 960000, priority: 4, lockedToEventId: null },
      { id: '6', name: 'Roll Armor', currencyId: CurrencyId.RerollShards, amount: 500000, priority: 5, lockedToEventId: null },
      { id: '7', name: 'Unlock SuperTower+', currencyId: CurrencyId.Stones, amount: 1000, priority: 6, lockedToEventId: null },
      { id: '8', name: 'ST+ lvl 0->1', currencyId: CurrencyId.Coins, amount: 965000000000000, durationDays: 2, priority: 7, lockedToEventId: '7' },
      { id: '9', name: 'ST+ lvl 1->2', currencyId: CurrencyId.Coins, amount: 1140000000000000, durationDays: 3, priority: 8, lockedToEventId: '8' },
      { id: '10', name: 'RPC+ lvl 0->1', currencyId: CurrencyId.Coins, amount: 965000000000000, durationDays: 2, priority: 9, lockedToEventId: null },
      { id: '11', name: 'Shatter Shards lvl 5', currencyId: CurrencyId.Coins, amount: 1040000000000000, durationDays: 40, priority: 10, lockedToEventId: null },
      { id: '12', name: 'WS+ Health', currencyId: CurrencyId.Coins, amount: 222000000000000, priority: 11, lockedToEventId: null },
    ]

    it('rerollShards events should trigger in priority order within same currency', () => {
      // Same-currency queueing: Roll Armor (priority 5) must wait for Roll DimCore (priority 4)
      const result = calculateTimeline(userIncomes, userEvents, 12, { startDate })

      const rollPc = result.events.find(e => e.event.name === 'Roll PC')
      const rollDimCore = result.events.find(e => e.event.name === 'Roll DimCore')
      const rollArmor = result.events.find(e => e.event.name === 'Roll Armor')

      expect(rollPc).toBeDefined()
      expect(rollDimCore).toBeDefined()
      expect(rollArmor).toBeDefined()

      // Expected behavior:
      // - Roll PC (priority 3, 800K) triggers week 0 - starting balance 1.51M is sufficient
      expect(rollPc!.triggerWeek).toBe(0)

      // - Roll DimCore (priority 4, 960K) should wait until affordable, then trigger
      //   After Roll PC: 1.51M - 800K = 710K remaining at end of week 0
      //   Week 0 income: ~233K -> ending balance ~943K after Roll PC deduction
      //   Actually: 1.51M + 233K - 800K = 943K, still not enough for 960K
      //   Week 1: 943K + 233K = 1.176M >= 960K, Roll DimCore triggers week 1
      expect(rollDimCore!.triggerWeek).toBe(1)

      // - Roll Armor (priority 5, 500K) should wait for Roll DimCore to trigger first
      //   This is the KEY expected behavior: Roll Armor must NOT trigger before Roll DimCore,
      //   even though 500K is affordable at week 0.
      //   Roll Armor should trigger AFTER Roll DimCore (week 1 or later).
      expect(rollArmor!.triggerWeek).toBeGreaterThanOrEqual(rollDimCore!.triggerWeek)

      // The key principle: within the same currency, events MUST trigger in priority order.
      // A lower priority event (Roll Armor, p5) should NOT trigger before a higher priority event
      // (Roll DimCore, p4) just because it happens to be affordable sooner.
    })

    it('coins free-floating events should trigger in priority order within same currency', () => {
      // Same-currency queueing: WS+ Health (priority 11) must wait for RPC+ (priority 9) and Shatter Shards (priority 10)
      const result = calculateTimeline(userIncomes, userEvents, 12, { startDate })

      const rpcPlus = result.events.find(e => e.event.name === 'RPC+ lvl 0->1')
      const shatterShards = result.events.find(e => e.event.name === 'Shatter Shards lvl 5')
      const wsHealth = result.events.find(e => e.event.name === 'WS+ Health')

      expect(rpcPlus).toBeDefined()
      expect(shatterShards).toBeDefined()
      expect(wsHealth).toBeDefined()

      // Expected behavior for free-floating coin events (not chained):
      // They should trigger in priority order, NOT affordability order.

      // RPC+ (priority 9) should trigger before Shatter Shards (priority 10)
      expect(rpcPlus!.triggerWeek).toBeLessThanOrEqual(shatterShards!.triggerWeek)

      // Shatter Shards (priority 10) should trigger before WS+ Health (priority 11)
      expect(shatterShards!.triggerWeek).toBeLessThanOrEqual(wsHealth!.triggerWeek)

      // WS+ Health (priority 11) should wait until both higher priority events trigger
      // Even though 222T is much cheaper than 965T or 1040T, the user set priority explicitly.
      expect(wsHealth!.triggerWeek).toBeGreaterThanOrEqual(rpcPlus!.triggerWeek)
      expect(wsHealth!.triggerWeek).toBeGreaterThanOrEqual(shatterShards!.triggerWeek)
    })
  })

  describe('negative balance prevention', () => {
    it('should delay third event when combined cost exceeds balance with proration', () => {
      // User scenario reproduction:
      // - Starting balance: 1,510,000 Shards
      // - Weekly income: ~330,000 (prorated week 0 to ~234,000 at 71%)
      // - Events: Roll PC (800K), Roll Armor (500K), Roll DimCore (960K)
      //
      // Expected behavior:
      // Week 0: start=1510K, income=234K (prorated), ending=1744K
      // After Roll PC: 1744K - 800K = 944K
      // After Roll Armor: 944K - 500K = 444K (week 0 ending balance)
      // Week 1: start=444K, income=330K, ending=774K
      // 774K < 960K, so Roll DimCore should NOT trigger at week 1
      // Week 2: start=774K, income=330K, ending=1104K >= 960K, triggers here
      const incomes: CurrencyIncome[] = [
        createTestIncome(CurrencyId.Stones, 1510000, 330000, 0),
      ]
      const events: SpendingEvent[] = [
        { id: '1', name: 'Roll PC', currencyId: CurrencyId.Stones, amount: 800000, priority: 0, lockedToEventId: null },
        { id: '2', name: 'Roll Armor', currencyId: CurrencyId.Stones, amount: 500000, priority: 1, lockedToEventId: null },
        { id: '3', name: 'Roll DimCore', currencyId: CurrencyId.Stones, amount: 960000, priority: 2, lockedToEventId: null },
      ]

      const result = calculateTimeline(incomes, events, 4, { startDate, week0ProrationFactor: 0.71 })

      // All events should be scheduled
      expect(result.events).toHaveLength(3)

      // Roll PC and Roll Armor should trigger week 0
      expect(result.events[0].triggerWeek).toBe(0)
      expect(result.events[1].triggerWeek).toBe(0)

      // Roll DimCore should NOT trigger at week 1 (774K < 960K)
      // It should trigger at week 2 (1104K >= 960K)
      expect(result.events[2].triggerWeek).toBe(2)

      // CRITICAL: No balance should ever be negative
      const balances = result.balancesByWeek.get(CurrencyId.Stones)!
      for (let i = 0; i < balances.length; i++) {
        expect(balances[i]).toBeGreaterThanOrEqual(0)
      }
    })

    it('should never produce negative ending balances in weekDisplayData', () => {
      // Simpler test case with exact numbers
      const incomes: CurrencyIncome[] = [
        createTestIncome(CurrencyId.Coins, 1000, 200, 0),
      ]
      const events: SpendingEvent[] = [
        { id: '1', name: 'Event 1', currencyId: CurrencyId.Coins, amount: 600, priority: 0, lockedToEventId: null },
        { id: '2', name: 'Event 2', currencyId: CurrencyId.Coins, amount: 500, priority: 1, lockedToEventId: null },
        { id: '3', name: 'Event 3', currencyId: CurrencyId.Coins, amount: 400, priority: 2, lockedToEventId: null },
      ]

      // Week 0: start=1000, income=200, ending=1200
      // After Event 1: 1200 - 600 = 600
      // After Event 2: 600 - 500 = 100 (ending balance week 0)
      // Week 1: start=100, income=200, ending=300 < 400
      // Week 2: start=300, income=200, ending=500 >= 400, triggers here
      const result = calculateTimeline(incomes, events, 4, { startDate })

      expect(result.events).toHaveLength(3)
      expect(result.events[0].triggerWeek).toBe(0)
      expect(result.events[1].triggerWeek).toBe(0)
      expect(result.events[2].triggerWeek).toBe(2) // NOT week 1

      // Check weekDisplayData balances
      const displayData = result.weekDisplayData.get(CurrencyId.Coins)!
      for (let i = 0; i < displayData.length; i++) {
        expect(displayData[i].balance).toBeGreaterThanOrEqual(0)
      }
    })

    it('should handle chained events that would cause negative balance', () => {
      // Test case: chained event that cannot afford but is forced to wait for predecessor
      const incomes: CurrencyIncome[] = [
        createTestIncome(CurrencyId.Coins, 1000, 200, 0),
      ]
      // Event 3 is CHAINED to Event 2
      // After Event 1 (600) and Event 2 (500) in week 0, balance = 100
      // Event 3 needs 400, chained to Event 2 (week 0)
      // minTriggerWeek = 0, so it checks balances[1] = 100 < 400
      // Should still wait until balance is sufficient
      const events: SpendingEvent[] = [
        { id: '1', name: 'Event 1', currencyId: CurrencyId.Coins, amount: 600, priority: 0, lockedToEventId: null },
        { id: '2', name: 'Event 2', currencyId: CurrencyId.Coins, amount: 500, priority: 1, lockedToEventId: null },
        { id: '3', name: 'Event 3', currencyId: CurrencyId.Coins, amount: 400, priority: 2, lockedToEventId: '2' },
      ]

      const result = calculateTimeline(incomes, events, 4, { startDate })

      expect(result.events).toHaveLength(3)
      // Events 1 and 2 trigger week 0
      expect(result.events[0].triggerWeek).toBe(0)
      expect(result.events[1].triggerWeek).toBe(0)
      // Event 3 is chained to Event 2 (week 0), but balance is only 100
      // It should STILL wait until week 2 when balance is 500
      expect(result.events[2].triggerWeek).toBe(2)

      // Verify no negative balances
      const balances = result.balancesByWeek.get(CurrencyId.Coins)!
      for (let i = 0; i < balances.length; i++) {
        expect(balances[i]).toBeGreaterThanOrEqual(0)
      }
    })

    it('should match user scenario: 610K available, 960K cost should NOT trigger', () => {
      // Exact user scenario reproduction:
      // - Week 0 ending after two events: 376K
      // - Week 1 income: 234K
      // - Week 1 ending (before Roll DimCore): 376K + 234K = 610K
      // - Roll DimCore costs 960K
      // - 610K < 960K, so Roll DimCore should NOT trigger at week 1
      //
      // Setup to achieve this:
      // - Starting balance: 1,510K
      // - Weekly income: 234K (use proration to simulate)
      // - Week 0 events: Roll PC (800K) + Roll Armor (500K) = 1,300K
      // - Week 0 ending: 1,510K + 234K - 1,300K = 444K
      // - Week 1 ending: 444K + 234K = 678K < 960K
      // - Week 2 ending: 678K + 234K = 912K < 960K
      // - Week 3 ending: 912K + 234K = 1146K >= 960K (triggers here)
      const incomes: CurrencyIncome[] = [
        createTestIncome(CurrencyId.Coins, 1510000, 234000, 0),
      ]
      const events: SpendingEvent[] = [
        { id: '1', name: 'Roll PC', currencyId: CurrencyId.Coins, amount: 800000, priority: 0, lockedToEventId: null },
        { id: '2', name: 'Roll Armor', currencyId: CurrencyId.Coins, amount: 500000, priority: 1, lockedToEventId: null },
        { id: '3', name: 'Roll DimCore', currencyId: CurrencyId.Coins, amount: 960000, priority: 2, lockedToEventId: null },
      ]

      const result = calculateTimeline(incomes, events, 8, { startDate })

      // All events should be scheduled
      expect(result.events).toHaveLength(3)

      // Roll PC triggers week 0 (1510K + 234K = 1744K >= 800K)
      expect(result.events[0].triggerWeek).toBe(0)
      expect(result.events[0].event.name).toBe('Roll PC')

      // Roll Armor triggers week 0 (1744K - 800K = 944K >= 500K)
      expect(result.events[1].triggerWeek).toBe(0)
      expect(result.events[1].event.name).toBe('Roll Armor')

      // Roll DimCore should trigger at week 3, NOT week 0 or 1
      // Week 0 ending: 1744K - 800K - 500K = 444K < 960K
      // Week 1 ending: 444K + 234K = 678K < 960K
      // Week 2 ending: 678K + 234K = 912K < 960K
      // Week 3 ending: 912K + 234K = 1146K >= 960K
      expect(result.events[2].triggerWeek).toBe(3)
      expect(result.events[2].event.name).toBe('Roll DimCore')

      // CRITICAL: Verify no negative balances anywhere
      const balances = result.balancesByWeek.get(CurrencyId.Coins)!
      for (let i = 0; i < balances.length; i++) {
        expect(balances[i]).toBeGreaterThanOrEqual(0)
      }

      // Also verify weekDisplayData has no negative balances
      const displayData = result.weekDisplayData.get(CurrencyId.Coins)!
      for (let i = 0; i < displayData.length; i++) {
        expect(displayData[i].balance).toBeGreaterThanOrEqual(0)
      }
    })
  })
})
