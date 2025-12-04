/**
 * Test Helpers for Run Details Tests
 *
 * Shared mock creators and formatters for breakdown calculation tests.
 */

import type { ParsedGameRun, GameRunField } from '@/shared/types/game-run.types'

/**
 * Simple number formatter for tests
 */
function formatTestNumber(value: number): string {
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`
  return String(value)
}

/**
 * Helper to create a mock game run with specified fields
 */
export function createMockRun(
  fields: Record<string, number | string>,
  overrides?: Partial<ParsedGameRun>
): ParsedGameRun {
  const runFields: Record<string, GameRunField> = {}

  for (const [key, value] of Object.entries(fields)) {
    const isNumber = typeof value === 'number'
    runFields[key] = {
      value,
      rawValue: String(value),
      displayValue: isNumber ? formatTestNumber(value) : String(value),
      originalKey: key,
      dataType: isNumber ? 'number' : 'string',
    }
  }

  return {
    id: 'test-run',
    timestamp: new Date('2024-03-15'),
    fields: runFields,
    tier: 11,
    wave: 1000,
    coinsEarned: 100000,
    cellsEarned: 50,
    realTime: 3600,
    runType: 'farm',
    ...overrides,
  }
}
