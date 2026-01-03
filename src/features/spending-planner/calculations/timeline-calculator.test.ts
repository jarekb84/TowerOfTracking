import { describe, it, expect } from 'vitest'
import { calculateTimeline, getWeekNumber, getWeekStartDate } from './timeline-calculator'
import { CurrencyId } from '../types'
import type { CurrencyIncome, SpendingEvent } from '../types'

describe('timeline-calculator', () => {
  // Use explicit date parts to avoid UTC parsing issues
  const startDate = new Date(2025, 0, 1) // Jan 1, 2025

  describe('calculateTimeline', () => {
    it('should schedule event in week 0 if affordable immediately', () => {
      const incomes: CurrencyIncome[] = [
        { currencyId: CurrencyId.Coins, currentBalance: 1000, weeklyIncome: 100, growthRatePercent: 0 },
      ]
      const events: SpendingEvent[] = [
        { id: '1', name: 'Event 1', currencyId: CurrencyId.Coins, amount: 500, priority: 0 },
      ]

      const result = calculateTimeline(incomes, events, 12, startDate)

      expect(result.events).toHaveLength(1)
      expect(result.events[0].triggerWeek).toBe(0)
      expect(result.events[0].balanceAtTrigger).toBe(1000)
    })

    it('should schedule event in later week if not affordable immediately', () => {
      const incomes: CurrencyIncome[] = [
        { currencyId: CurrencyId.Coins, currentBalance: 100, weeklyIncome: 100, growthRatePercent: 0 },
      ]
      const events: SpendingEvent[] = [
        { id: '1', name: 'Event 1', currencyId: CurrencyId.Coins, amount: 500, priority: 0 },
      ]

      const result = calculateTimeline(incomes, events, 12, startDate)

      expect(result.events).toHaveLength(1)
      expect(result.events[0].triggerWeek).toBe(4) // 100 + 4*100 = 500
    })

    it('should process events in priority order', () => {
      const incomes: CurrencyIncome[] = [
        { currencyId: CurrencyId.Coins, currentBalance: 1000, weeklyIncome: 100, growthRatePercent: 0 },
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
        { currencyId: CurrencyId.Coins, currentBalance: 500, weeklyIncome: 100, growthRatePercent: 0 },
      ]
      const events: SpendingEvent[] = [
        { id: '1', name: 'Event 1', currencyId: CurrencyId.Coins, amount: 400, priority: 0 },
        { id: '2', name: 'Event 2', currencyId: CurrencyId.Coins, amount: 200, priority: 1 },
      ]

      const result = calculateTimeline(incomes, events, 12, startDate)

      expect(result.events).toHaveLength(2)
      // Event 1: triggers week 0 (500 >= 400)
      expect(result.events[0].triggerWeek).toBe(0)
      // Event 2: balance after event 1 is 100, needs 200, so triggers week 1 (100+100=200)
      expect(result.events[1].triggerWeek).toBe(1)
    })

    it('should handle multiple currencies independently when sequence allows', () => {
      const incomes: CurrencyIncome[] = [
        { currencyId: CurrencyId.Coins, currentBalance: 500, weeklyIncome: 100, growthRatePercent: 0 },
        { currencyId: CurrencyId.Stones, currentBalance: 200, weeklyIncome: 50, growthRatePercent: 0 },
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
        { currencyId: CurrencyId.Coins, currentBalance: 100, weeklyIncome: 100, growthRatePercent: 0 },
        { currencyId: CurrencyId.Stones, currentBalance: 500, weeklyIncome: 50, growthRatePercent: 0 },
      ]
      // Event 1 (coins) can't afford until week 4
      // Event 2 (stones) COULD afford immediately at week 0
      // But Event 2 should wait for Event 1 due to queue sequence
      const events: SpendingEvent[] = [
        { id: '1', name: 'Coin Event', currencyId: CurrencyId.Coins, amount: 500, priority: 0 },
        { id: '2', name: 'Stone Event', currencyId: CurrencyId.Stones, amount: 100, priority: 1 },
      ]

      const result = calculateTimeline(incomes, events, 12, startDate)

      expect(result.events).toHaveLength(2)
      // Coin event triggers at week 4 (100 + 4*100 = 500)
      expect(result.events[0].triggerWeek).toBe(4)
      // Stone event must wait until week 4 even though balance allows week 0
      expect(result.events[1].triggerWeek).toBe(4)
    })

    it('should mark events as unaffordable if cannot be afforded within timeline', () => {
      const incomes: CurrencyIncome[] = [
        { currencyId: CurrencyId.Coins, currentBalance: 100, weeklyIncome: 10, growthRatePercent: 0 },
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
        { currencyId: CurrencyId.Coins, currentBalance: 100, weeklyIncome: 100, growthRatePercent: 0 },
      ]
      const events: SpendingEvent[] = [
        { id: '1', name: 'Event', currencyId: CurrencyId.Coins, amount: 300, priority: 0 },
      ]

      const result = calculateTimeline(incomes, events, 12, startDate)

      expect(result.events).toHaveLength(1)
      expect(result.events[0].triggerWeek).toBe(2) // Week 2: 100 + 2*100 = 300
      // 2 weeks after Jan 1 = Jan 15
      expect(result.events[0].triggerDate.getDate()).toBe(15)
    })

    it('should calculate end dates for events with duration', () => {
      const incomes: CurrencyIncome[] = [
        { currencyId: CurrencyId.Coins, currentBalance: 1000, weeklyIncome: 100, growthRatePercent: 0 },
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
        { currencyId: CurrencyId.Coins, currentBalance: 100, weeklyIncome: 50, growthRatePercent: 0 },
      ]
      const events: SpendingEvent[] = []

      const result = calculateTimeline(incomes, events, 4, startDate)

      const coinBalances = result.balancesByWeek.get(CurrencyId.Coins)
      expect(coinBalances).toBeDefined()
      expect(coinBalances).toEqual([100, 150, 200, 250, 300])
    })

    it('should include income projections in result', () => {
      const incomes: CurrencyIncome[] = [
        { currencyId: CurrencyId.Coins, currentBalance: 100, weeklyIncome: 50, growthRatePercent: 0 },
      ]
      const events: SpendingEvent[] = []

      const result = calculateTimeline(incomes, events, 4, startDate)

      const coinIncomes = result.incomeByWeek.get(CurrencyId.Coins)
      expect(coinIncomes).toBeDefined()
      expect(coinIncomes).toEqual([50, 50, 50, 50])
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
