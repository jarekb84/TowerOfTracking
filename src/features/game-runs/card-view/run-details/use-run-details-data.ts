/**
 * Run Details Data Hook
 *
 * Orchestrates the preparation of purpose-based run details data.
 * Delegates all calculations to pure functions.
 */

import { useMemo } from 'react'
import type { ParsedGameRun } from '@/shared/types/game-run.types'
import type { RunDetailsData } from './types'
import {
  calculateBreakdownGroup,
  extractPlainFields,
  findUncategorizedFields,
  calculatePerHourRate,
} from './breakdown/breakdown-calculations'
import { formatGameSpeed } from '@/shared/formatting/run-display-formatters'
import { formatLargeNumber } from '@/shared/formatting/number-scale'
import {
  BATTLE_REPORT_ESSENTIAL,
  BATTLE_REPORT_MISCELLANEOUS,
  DAMAGE_DEALT_CONFIG,
  DAMAGE_TAKEN_CONFIG,
  ENEMIES_DESTROYED_CONFIG,
  DESTROYED_BY_CONFIG,
  COINS_EARNED_CONFIG,
  OTHER_EARNINGS_CONFIG,
  UPGRADE_SHARDS_CONFIG,
  MODULES_CONFIG,
  CATEGORIZED_FIELDS,
  SKIP_FIELDS,
  REROLL_SHARDS_CONFIG,
  ENEMIES_AFFECTED_BY_CONFIG,
  COMBAT_MISC_CONFIG,
} from './section-config'

/**
 * Hook that prepares all run details data for display.
 * Memoized to avoid recalculation on every render.
 */
export function useRunDetailsData(run: ParsedGameRun): RunDetailsData {
  return useMemo(() => {
    // Battle Report section
    const battleReport = {
      essential: extractPlainFields(run, BATTLE_REPORT_ESSENTIAL),
      miscellaneous: extractPlainFields(run, BATTLE_REPORT_MISCELLANEOUS),
    }

    // Add game speed from cached property
    if (run.gameSpeed !== null) {
      battleReport.essential.items.push({
        fieldName: 'gameSpeed',
        displayName: 'Game Speed',
        displayValue: formatGameSpeed(run.gameSpeed),
      })
    }

    // Combat section
    const combat = {
      damageDealt: calculateBreakdownGroup(run, DAMAGE_DEALT_CONFIG),
      damageTaken: extractPlainFields(run, DAMAGE_TAKEN_CONFIG),
      combatMisc: extractPlainFields(run, COMBAT_MISC_CONFIG),
      enemiesDestroyed: calculateBreakdownGroup(run, ENEMIES_DESTROYED_CONFIG),
      destroyedBy: calculateBreakdownGroup(run, DESTROYED_BY_CONFIG),
    }

    // Economic section
    const coinsEarned = calculateBreakdownGroup(run, COINS_EARNED_CONFIG)
    const enemiesAffectedBy = calculateBreakdownGroup(run, ENEMIES_AFFECTED_BY_CONFIG)
    const otherEarnings = extractPlainFields(run, OTHER_EARNINGS_CONFIG)

    // Add cells per hour as a computed field
    const cellsPerHour = calculatePerHourRate(run.cellsEarned, run.realTime)
    if (cellsPerHour > 0) {
      otherEarnings.items.push({
        fieldName: 'cellsPerHour',
        displayName: 'Cells/Hour',
        displayValue: formatLargeNumber(cellsPerHour),
      })
    }

    const economic = {
      coinsEarned,
      enemiesAffectedBy,
      otherEarnings,
    }

    // Modules section
    const modules = {
      upgradeShards: calculateBreakdownGroup(run, UPGRADE_SHARDS_CONFIG),
      rerollShards: calculateBreakdownGroup(run, REROLL_SHARDS_CONFIG),
      modules: calculateBreakdownGroup(run, MODULES_CONFIG),
    }

    // Uncategorized fields (fallback for new/unknown fields)
    const uncategorized = findUncategorizedFields(run, CATEGORIZED_FIELDS, SKIP_FIELDS)

    return {
      battleReport,
      combat,
      economic,
      modules,
      uncategorized,
    }
  }, [run])
}
