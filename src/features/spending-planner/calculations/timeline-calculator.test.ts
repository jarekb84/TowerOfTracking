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

    it('should handle mixed chained and free-floating events', () => {
      const incomes: CurrencyIncome[] = [
        createTestIncome(CurrencyId.Coins, 100, 100, 0),
        createTestIncome(CurrencyId.Stones, 200, 50, 0),
      ]
      // Event 1 (coins) - free-floating, needs week 3
      // Event 2 (stones) - chained to 1, has enough balance but must wait
      // Event 3 (coins) - free-floating, can trigger whenever balance allows
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
      // Event 3: free-floating, can trigger at week 0 (200 >= 150)
      expect(result.events[2].triggerWeek).toBe(0)
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
})
