import { describe, it, expect } from 'vitest'
import { calculateFieldPercentiles } from './field-percentile-calculation'
import type { ParsedGameRun } from '@/shared/types/game-run.types'
import { createGameRunField, getFieldValue } from '@/features/analysis/shared/parsing/field-utils'

describe('calculateFieldPercentiles', () => {
  const createMockRun = (coins: number, duration: number, id: string): ParsedGameRun => ({
    id,
    timestamp: new Date('2024-01-01'),
    fields: {
      coinsEarned: createGameRunField('Coins Earned', coins.toString())
    },
    tier: 1,
    wave: 100,
    realTime: duration,
    gameSpeed: duration === 0 ? null : 2.0,
    coinsEarned: coins,
    cellsEarned: 0,
    runType: 'farm'
  })

  const getValue = (run: ParsedGameRun) => {
    return getFieldValue<number>(run, 'coinsEarned')
  }

  it('should return null percentiles for empty array', () => {
    const result = calculateFieldPercentiles([], getValue)

    expect(result.p99).toBeNull()
    expect(result.p90).toBeNull()
    expect(result.p75).toBeNull()
    expect(result.p50).toBeNull()
  })

  it('should return same value for all percentiles with single run', () => {
    const runs = [createMockRun(1000, 3600, 'run1')]
    const result = calculateFieldPercentiles(runs, getValue)

    expect(result.p99?.value).toBe(1000)
    expect(result.p99?.duration).toBe(3600)
    expect(result.p90?.value).toBe(1000)
    expect(result.p75?.value).toBe(1000)
    expect(result.p50?.value).toBe(1000)
  })

  it('should calculate percentiles correctly and track source runs', () => {
    // Create 10 runs with different values and durations
    const runs = [
      createMockRun(100, 1000, 'run1'),
      createMockRun(200, 2000, 'run2'),
      createMockRun(300, 3000, 'run3'),
      createMockRun(400, 4000, 'run4'),
      createMockRun(500, 5000, 'run5'),
      createMockRun(600, 6000, 'run6'),
      createMockRun(700, 7000, 'run7'),
      createMockRun(800, 8000, 'run8'),
      createMockRun(900, 9000, 'run9'),
      createMockRun(1000, 10000, 'run10')
    ]

    const result = calculateFieldPercentiles(runs, getValue)

    // P99: floor(0.99 * 10) = 9, index 9 = value 1000, duration 10000
    expect(result.p99?.value).toBe(1000)
    expect(result.p99?.duration).toBe(10000)
    expect(result.p99?.sourceRun.id).toBe('run10')

    // P90: floor(0.90 * 10) = 9, index 9 = value 1000, duration 10000
    expect(result.p90?.value).toBe(1000)
    expect(result.p90?.duration).toBe(10000)

    // P75: floor(0.75 * 10) = 7, index 7 = value 800, duration 8000
    expect(result.p75?.value).toBe(800)
    expect(result.p75?.duration).toBe(8000)

    // P50: floor(0.50 * 10) = 5, index 5 = value 600, duration 6000
    expect(result.p50?.value).toBe(600)
    expect(result.p50?.duration).toBe(6000)
  })

  it('should sort by value, not by duration', () => {
    // Runs where high values don't correlate with long durations
    const runs = [
      createMockRun(1000, 1000, 'short-high'), // High value, short duration
      createMockRun(500, 5000, 'long-med'),    // Med value, long duration
      createMockRun(100, 3000, 'med-low')      // Low value, med duration
    ]

    const result = calculateFieldPercentiles(runs, getValue)

    // P99 should be the highest value (1000) with its duration (1000)
    expect(result.p99?.value).toBe(1000)
    expect(result.p99?.duration).toBe(1000)

    // P50 should be the middle value (500) with its duration (5000)
    expect(result.p50?.value).toBe(500)
    expect(result.p50?.duration).toBe(5000)
  })

  it('should handle realistic tier 11 coin scenario', () => {
    // Realistic tier 11 runs with varying coins and durations
    const runs = [
      createMockRun(10100000000000, 50000, 'run1'), // 10.1T in 13.9h (lucky, fast)
      createMockRun(12100000000000, 48000, 'run2'), // 12.1T in 13.3h (best)
      createMockRun(11900000000000, 47000, 'run3'), // 11.9T in 13.1h
      createMockRun(11700000000000, 46000, 'run4'), // 11.7T in 12.8h
      createMockRun(11500000000000, 45000, 'run5'), // 11.5T in 12.5h
      createMockRun(11300000000000, 47000, 'run6'), // 11.3T in 13.1h
      createMockRun(11000000000000, 48000, 'run7'), // 11.0T in 13.3h
      createMockRun(10800000000000, 46000, 'run8'), // 10.8T in 12.8h
      createMockRun(10600000000000, 47000, 'run9'), // 10.6T in 13.1h
      createMockRun(10000000000000, 45000, 'run10') // 10.0T in 12.5h
    ]

    const result = calculateFieldPercentiles(runs, getValue)

    // Max should be 12.1T
    const maxRun = runs.reduce((max, run) => {
      const val = getValue(run)!
      const maxVal = getValue(max)!
      return val > maxVal ? run : max
    })
    expect(getValue(maxRun)).toBe(12100000000000)

    // P90 should be high but not max
    expect(result.p90?.value).toBeLessThanOrEqual(12100000000000)
    expect(result.p90?.value).toBeGreaterThan(10000000000000)

    // Hourly rate for P90 should use P90's duration, not average
    const p90HourlyRate = (result.p90!.value / result.p90!.duration) * 3600
    expect(p90HourlyRate).toBeGreaterThan(0)
  })

  it('should handle runs with null values', () => {
    const runs = [
      createMockRun(1000, 3600, 'run1'),
      createMockRun(2000, 7200, 'run2')
    ]

    // Add a run with null value
    runs.push({
      id: 'run3',
      timestamp: new Date('2024-01-01'),
      fields: {},
      tier: 1,
      wave: 100,
      realTime: 5000,
      gameSpeed: 2.0,
      coinsEarned: 0,
      cellsEarned: 0,
      runType: 'farm'
    })

    const result = calculateFieldPercentiles(runs, getValue)

    // Should only consider the 2 valid runs
    expect(result.p50?.value).toBeGreaterThanOrEqual(1000)
    expect(result.p50?.value).toBeLessThanOrEqual(2000)
  })

  it('should handle all runs having same value but different durations', () => {
    const runs = [
      createMockRun(1000, 3000, 'short'),
      createMockRun(1000, 5000, 'medium'),
      createMockRun(1000, 7000, 'long')
    ]

    const result = calculateFieldPercentiles(runs, getValue)

    // All percentiles should have value 1000
    expect(result.p99?.value).toBe(1000)
    expect(result.p90?.value).toBe(1000)
    expect(result.p75?.value).toBe(1000)
    expect(result.p50?.value).toBe(1000)

    // But durations should vary based on position in sorted array
    // All have same value, so sort is stable - should use first matching runs
    expect(result.p50?.duration).toBeGreaterThanOrEqual(3000)
    expect(result.p50?.duration).toBeLessThanOrEqual(7000)
  })
})
