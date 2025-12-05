/**
 * Breakdown Primitive Function Tests
 *
 * Tests for low-level utility functions used in breakdown calculations:
 * - extractFieldValue
 * - fieldExists
 * - calculateBreakdownPercentage
 * - calculateSumTotal
 * - calculatePerHourRate
 * - sortBreakdownItems
 */

import { describe, it, expect } from 'vitest'
import { createMockRun } from '../test-helpers'
import {
  extractFieldValue,
  fieldExists,
  calculateBreakdownPercentage,
  calculateSumTotal,
  calculatePerHourRate,
  sortBreakdownItems,
} from './breakdown-calculations'

// =============================================================================
// extractFieldValue
// =============================================================================

describe('extractFieldValue', () => {
  it('returns numeric value when field exists', () => {
    const run = createMockRun({ damageDealt: 1000000 })
    expect(extractFieldValue(run, 'damageDealt')).toBe(1000000)
  })

  it('returns 0 when field does not exist', () => {
    const run = createMockRun({})
    expect(extractFieldValue(run, 'nonexistent')).toBe(0)
  })

  it('returns 0 when field value is not a number', () => {
    const run = createMockRun({ killedBy: 'Boss' })
    expect(extractFieldValue(run, 'killedBy')).toBe(0)
  })
})

// =============================================================================
// fieldExists
// =============================================================================

describe('fieldExists', () => {
  it('returns true when field exists with value', () => {
    const run = createMockRun({ damageDealt: 1000 })
    expect(fieldExists(run, 'damageDealt')).toBe(true)
  })

  it('returns true when field exists with zero value', () => {
    const run = createMockRun({ damageDealt: 0 })
    expect(fieldExists(run, 'damageDealt')).toBe(true)
  })

  it('returns false when field does not exist', () => {
    const run = createMockRun({})
    expect(fieldExists(run, 'nonexistent')).toBe(false)
  })
})

// =============================================================================
// calculateBreakdownPercentage
// =============================================================================

describe('calculateBreakdownPercentage', () => {
  it('calculates correct percentage', () => {
    expect(calculateBreakdownPercentage(50, 100)).toBe(50)
  })

  it('rounds to 2 decimal places', () => {
    expect(calculateBreakdownPercentage(1, 3)).toBe(33.33)
  })

  it('returns 0 when value is 0', () => {
    expect(calculateBreakdownPercentage(0, 100)).toBe(0)
  })

  it('returns 0 when total is 0', () => {
    expect(calculateBreakdownPercentage(50, 0)).toBe(0)
  })

  it('returns 0 when both are 0', () => {
    expect(calculateBreakdownPercentage(0, 0)).toBe(0)
  })

  it('handles value greater than total (>100%)', () => {
    expect(calculateBreakdownPercentage(150, 100)).toBe(150)
  })
})

// =============================================================================
// calculateSumTotal
// =============================================================================

describe('calculateSumTotal', () => {
  it('sums values from multiple fields', () => {
    const run = createMockRun({
      rerollShards: 100,
      armorShards: 50,
      coreShards: 75,
    })
    const total = calculateSumTotal(run, ['rerollShards', 'armorShards', 'coreShards'])
    expect(total).toBe(225)
  })

  it('returns 0 when no fields exist', () => {
    const run = createMockRun({})
    const total = calculateSumTotal(run, ['nonexistent1', 'nonexistent2'])
    expect(total).toBe(0)
  })

  it('handles mix of existing and missing fields', () => {
    const run = createMockRun({ rerollShards: 100 })
    const total = calculateSumTotal(run, ['rerollShards', 'nonexistent'])
    expect(total).toBe(100)
  })

  it('returns 0 for empty field list', () => {
    const run = createMockRun({ rerollShards: 100 })
    const total = calculateSumTotal(run, [])
    expect(total).toBe(0)
  })
})

// =============================================================================
// calculatePerHourRate
// =============================================================================

describe('calculatePerHourRate', () => {
  it('calculates correct per-hour rate', () => {
    // 3600 seconds = 1 hour, 1000 value = 1000/hour
    expect(calculatePerHourRate(1000, 3600)).toBe(1000)
  })

  it('calculates for partial hours', () => {
    // 1800 seconds = 0.5 hours, 500 value = 1000/hour
    expect(calculatePerHourRate(500, 1800)).toBe(1000)
  })

  it('returns 0 when duration is 0', () => {
    expect(calculatePerHourRate(1000, 0)).toBe(0)
  })

  it('handles large values', () => {
    // 7200 seconds = 2 hours, 100M value = 50M/hour
    expect(calculatePerHourRate(100000000, 7200)).toBe(50000000)
  })
})

// =============================================================================
// sortBreakdownItems
// =============================================================================

describe('sortBreakdownItems', () => {
  it('sorts by percentage descending', () => {
    const items = [
      { fieldName: 'a', displayName: 'A', color: '#fff', value: 10, percentage: 10, displayValue: '10' },
      { fieldName: 'b', displayName: 'B', color: '#fff', value: 50, percentage: 50, displayValue: '50' },
      { fieldName: 'c', displayName: 'C', color: '#fff', value: 25, percentage: 25, displayValue: '25' },
    ]

    const sorted = sortBreakdownItems(items)

    expect(sorted[0].percentage).toBe(50)
    expect(sorted[1].percentage).toBe(25)
    expect(sorted[2].percentage).toBe(10)
  })

  it('uses value as tiebreaker for equal percentages', () => {
    const items = [
      { fieldName: 'a', displayName: 'A', color: '#fff', value: 100, percentage: 50, displayValue: '100' },
      { fieldName: 'b', displayName: 'B', color: '#fff', value: 200, percentage: 50, displayValue: '200' },
    ]

    const sorted = sortBreakdownItems(items)

    expect(sorted[0].value).toBe(200)
    expect(sorted[1].value).toBe(100)
  })

  it('does not mutate original array', () => {
    const items = [
      { fieldName: 'a', displayName: 'A', color: '#fff', value: 10, percentage: 10, displayValue: '10' },
      { fieldName: 'b', displayName: 'B', color: '#fff', value: 50, percentage: 50, displayValue: '50' },
    ]

    const sorted = sortBreakdownItems(items)

    expect(items[0].percentage).toBe(10) // Original unchanged
    expect(sorted[0].percentage).toBe(50)
  })
})
