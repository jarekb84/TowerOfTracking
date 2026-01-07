/**
 * Integration Tests: Timeline Calculator weekDisplayData
 *
 * These tests verify that the timeline calculator produces correct display data
 * through the weekDisplayData field. This is the SINGLE SOURCE OF TRUTH for
 * what the display layer should render.
 *
 * Previously, these tests verified the calculateWeekBalance() function in the
 * display layer. That function has been removed as part of the architectural
 * refactoring - all balance calculations now happen in the timeline calculator.
 */
import { describe, it, expect } from 'vitest'
import { calculateTimeline } from '../../calculations/timeline-calculator'
import { CurrencyId, CurrencyIncome, SpendingEvent, WeekDisplayData } from '../../types'

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

/** Helper to get week display data for a specific currency and week */
function getWeekData(
  timeline: ReturnType<typeof calculateTimeline>,
  currencyId: CurrencyId,
  weekIndex: number
): WeekDisplayData {
  const currencyData = timeline.weekDisplayData.get(currencyId)
  if (!currencyData || weekIndex >= currencyData.length) {
    return { priorBalance: 0, income: 0, expenditure: 0, balance: 0 }
  }
  return currencyData[weekIndex]
}

describe('Timeline Calculator weekDisplayData', () => {
  const startDate = new Date(2025, 0, 1)

  describe('week 0 (current week) with proration', () => {
    it('should show prorated income for week 0', () => {
      // Starting balance: 255, Full income: 500, Proration: 0.26
      // Expected prorated income: 500 * 0.26 = 130
      // Expected ending balance: 255 + 130 = 385
      const incomes: CurrencyIncome[] = [createTestIncome(CurrencyId.Stones, 255, 500, 0)]
      const prorationFactor = 0.26

      const timeline = calculateTimeline(incomes, [], 4, { startDate, week0ProrationFactor: prorationFactor })
      const week0 = getWeekData(timeline, CurrencyId.Stones, 0)

      // Display income should be prorated
      expect(week0.income).toBeCloseTo(130, 0)
      // Ending balance should reflect prorated income
      expect(week0.balance).toBeCloseTo(385, 0)
      // Prior balance should be starting balance
      expect(week0.priorBalance).toBe(255)
      expect(week0.expenditure).toBe(0)
    })

    it('should handle expenditure in week 0 with proration', () => {
      // Starting: 500, Full income: 500, Proration: 0.5, Expenditure: 200
      // Prorated income: 250, Ending: 500 + 250 - 200 = 550
      const incomes: CurrencyIncome[] = [createTestIncome(CurrencyId.Stones, 500, 500, 0)]
      const events: SpendingEvent[] = [
        { id: '1', name: 'Event', currencyId: CurrencyId.Stones, amount: 200, priority: 0, lockedToEventId: null },
      ]
      const prorationFactor = 0.5

      const timeline = calculateTimeline(incomes, events, 4, { startDate, week0ProrationFactor: prorationFactor })
      const week0 = getWeekData(timeline, CurrencyId.Stones, 0)

      expect(week0.priorBalance).toBe(500)
      expect(week0.income).toBe(250)
      expect(week0.expenditure).toBe(200)
      expect(week0.balance).toBe(550)
    })

    it('should work with full week (factor 1)', () => {
      // Starting: 255, Full income: 500, Proration: 1
      // Ending: 255 + 500 = 755
      const incomes: CurrencyIncome[] = [createTestIncome(CurrencyId.Stones, 255, 500, 0)]

      const timeline = calculateTimeline(incomes, [], 4, { startDate, week0ProrationFactor: 1 })
      const week0 = getWeekData(timeline, CurrencyId.Stones, 0)

      expect(week0.priorBalance).toBe(255)
      expect(week0.income).toBe(500)
      expect(week0.balance).toBe(755)
    })
  })

  describe('week N > 0 (future weeks)', () => {
    it('should show full income for future weeks with proration applied to week 0', () => {
      // Starting: 255, Full income: 500, Proration: 0.26
      // Week 0 ending: 255 + 130 = 385
      // Week 1: prior 385, income 500, ending 885
      const incomes: CurrencyIncome[] = [createTestIncome(CurrencyId.Stones, 255, 500, 0)]
      const prorationFactor = 0.26

      const timeline = calculateTimeline(incomes, [], 4, { startDate, week0ProrationFactor: prorationFactor })
      const week1 = getWeekData(timeline, CurrencyId.Stones, 1)

      // Week 1 should have full income (not prorated)
      expect(week1.income).toBe(500)
      // Prior balance should be week 0's ending balance
      expect(week1.priorBalance).toBeCloseTo(385, 0)
      // Ending balance
      expect(week1.balance).toBeCloseTo(885, 0)
    })

    it('should handle expenditure in future week', () => {
      // Use proration that delays event to week 1
      // Starting: 100, Full income: 100, Cost: 150
      // With 50% proration: 100 + 50 = 150 >= 150, triggers week 0
      // Let's use a scenario where event triggers in week 1
      const incomes: CurrencyIncome[] = [createTestIncome(CurrencyId.Coins, 100, 200, 0)]
      const events: SpendingEvent[] = [
        { id: '1', name: 'Event', currencyId: CurrencyId.Coins, amount: 150, priority: 0, lockedToEventId: null },
      ]
      const prorationFactor = 0.2 // 100 + 40 = 140 < 150, so delay to week 1

      const timeline = calculateTimeline(incomes, events, 4, { startDate, week0ProrationFactor: prorationFactor })

      // Event should be delayed to week 1
      expect(timeline.events[0].triggerWeek).toBe(1)

      const week1 = getWeekData(timeline, CurrencyId.Coins, 1)
      // Prior: 140 (week 0 ending), Income: 200, Expenditure: 150
      // Ending: 140 + 200 - 150 = 190
      expect(week1.priorBalance).toBeCloseTo(140, 0)
      expect(week1.income).toBe(200)
      expect(week1.expenditure).toBe(150)
      expect(week1.balance).toBeCloseTo(190, 0)
    })
  })

  describe('user-reported scenario', () => {
    // Starting balance: 255T, Week 0: +130T prorated -> 385T ending balance
    // Week 1: prior 385T, +500T income, -672T spending -> ~213T ending balance

    it('should calculate week 0 correctly with large numbers', () => {
      const incomes: CurrencyIncome[] = [createTestIncome(CurrencyId.Stones, 255e12, 500e12, 0)]
      const prorationFactor = 0.26

      const timeline = calculateTimeline(incomes, [], 4, { startDate, week0ProrationFactor: prorationFactor })
      const week0 = getWeekData(timeline, CurrencyId.Stones, 0)

      expect(week0.priorBalance).toBe(255e12)
      expect(week0.income).toBeCloseTo(130e12, -9)
      expect(week0.balance).toBeCloseTo(385e12, -9)
    })

    it('should calculate week 1 correctly with spending', () => {
      const incomes: CurrencyIncome[] = [createTestIncome(CurrencyId.Stones, 255e12, 500e12, 0)]
      const events: SpendingEvent[] = [
        { id: '1', name: 'Event', currencyId: CurrencyId.Stones, amount: 672e12, priority: 0, lockedToEventId: null },
      ]
      const prorationFactor = 0.26

      const timeline = calculateTimeline(incomes, events, 4, { startDate, week0ProrationFactor: prorationFactor })

      // Event should trigger at week 1 since week 0 ending = 385T < 672T
      expect(timeline.events[0].triggerWeek).toBe(1)

      const week1 = getWeekData(timeline, CurrencyId.Stones, 1)
      // Prior: 385T, Income: 500T, Expenditure: 672T
      // Ending: 385T + 500T - 672T = 213T
      expect(week1.priorBalance).toBeCloseTo(385e12, -9)
      expect(week1.income).toBe(500e12)
      expect(week1.expenditure).toBe(672e12)
      expect(week1.balance).toBeCloseTo(213e12, -9)
    })
  })
})

/**
 * INTEGRATION TEST: Timeline Calculator + Display Layer Contract
 *
 * These tests ensure the display layer can simply render weekDisplayData values
 * without any additional calculations, and the results will be correct.
 */
describe('Timeline Calculator + Display Layer Integration', () => {
  const startDate = new Date(2025, 0, 1)

  it('should never produce negative balance when timeline calculator deems event affordable', () => {
    // Scenario: Event costs 700, starting balance 500, prorated income 250 (500 * 0.5)
    // Affordable: 500 + 250 = 750 >= 700, so event triggers in week 0
    const incomes: CurrencyIncome[] = [createTestIncome(CurrencyId.Stones, 500, 500, 0)]
    const events: SpendingEvent[] = [
      { id: '1', name: 'Affordable Event', currencyId: CurrencyId.Stones, amount: 700, priority: 0, lockedToEventId: null },
    ]
    const prorationFactor = 0.5

    const timeline = calculateTimeline(incomes, events, 4, { startDate, week0ProrationFactor: prorationFactor })

    // Event should be affordable and trigger at week 0
    expect(timeline.events).toHaveLength(1)
    expect(timeline.events[0].triggerWeek).toBe(0)

    // Check week 0 display data
    const week0 = getWeekData(timeline, CurrencyId.Stones, 0)

    // Display balance should NEVER be negative for an affordable event
    expect(week0.balance).toBeGreaterThanOrEqual(0)
    // Expected: 500 + 250 - 700 = 50
    expect(week0.balance).toBe(50)
  })

  it('should show consistent balances across all weeks', () => {
    const incomes: CurrencyIncome[] = [createTestIncome(CurrencyId.Coins, 100, 100, 0)]
    const events: SpendingEvent[] = [
      { id: '1', name: 'Event 1', currencyId: CurrencyId.Coins, amount: 150, priority: 0, lockedToEventId: null },
    ]
    const prorationFactor = 0.5

    const timeline = calculateTimeline(incomes, events, 4, { startDate, week0ProrationFactor: prorationFactor })

    // 100 + 50 = 150 >= 150, so event triggers week 0
    expect(timeline.events[0].triggerWeek).toBe(0)

    // Verify all weeks have non-negative balances and proper flow
    for (let week = 0; week < 4; week++) {
      const display = getWeekData(timeline, CurrencyId.Coins, week)

      // Balance should never go negative for affordable events
      expect(display.balance).toBeGreaterThanOrEqual(0)

      // Week ending balance should flow to next week's prior balance
      if (week < 3) {
        const nextDisplay = getWeekData(timeline, CurrencyId.Coins, week + 1)
        expect(nextDisplay.priorBalance).toBeCloseTo(display.balance, 5)
      }
    }
  })

  it('should handle the exact bug scenario: proration causing double-subtraction', () => {
    // This is the exact scenario that caused the original bug:
    // Starting: 499, Full income: 446, Cost: 750
    // With 50% proration: 499 + 223 = 722 < 750, so event should delay to week 1
    const incomes: CurrencyIncome[] = [createTestIncome(CurrencyId.Stones, 499, 446, 0)]
    const events: SpendingEvent[] = [
      { id: '1', name: 'Expensive Event', currencyId: CurrencyId.Stones, amount: 750, priority: 0, lockedToEventId: null },
    ]
    const prorationFactor = 0.5

    const timeline = calculateTimeline(incomes, events, 4, { startDate, week0ProrationFactor: prorationFactor })

    // Event should be delayed to week 1 due to insufficient prorated income
    expect(timeline.events).toHaveLength(1)
    expect(timeline.events[0].triggerWeek).toBe(1)

    // Check week 0 - no event, should show prorated balance
    const week0 = getWeekData(timeline, CurrencyId.Stones, 0)
    // Week 0: 499 + 223 = 722 (no spending)
    expect(week0.balance).toBeCloseTo(722, 0)
    expect(week0.balance).toBeGreaterThan(0)

    // Check week 1 - event triggers
    const week1 = getWeekData(timeline, CurrencyId.Stones, 1)
    // Week 1: 722 + 446 - 750 = 418
    expect(week1.balance).toBeCloseTo(418, 0)
    expect(week1.balance).toBeGreaterThan(0)
  })

  it('should include metadata about calculation parameters', () => {
    const incomes: CurrencyIncome[] = [createTestIncome(CurrencyId.Coins, 100, 100, 0)]
    const prorationFactor = 0.75

    const timeline = calculateTimeline(incomes, [], 4, { startDate, week0ProrationFactor: prorationFactor })

    // Meta should be populated
    expect(timeline.meta).toBeDefined()
    expect(timeline.meta.week0ProrationFactor).toBe(0.75)
    expect(timeline.meta.startDate).toEqual(startDate)
  })
})
