/**
 * Mini Coverage Report Hook
 *
 * Provides memoized coverage data for a single run.
 */

import { useMemo } from 'react'
import type { ParsedGameRun } from '@/shared/types/game-run.types'
import { calculateMiniCoverageData, type MiniCoverageData } from './mini-coverage-calculations'

/**
 * Calculate and memoize coverage data for a run
 * Returns null if run has no valid coverage data
 */
export function useMiniCoverageReport(run: ParsedGameRun): MiniCoverageData | null {
  return useMemo(() => calculateMiniCoverageData(run), [run])
}
