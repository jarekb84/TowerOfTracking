/**
 * Income Source Indicator Component
 *
 * Shows whether a value is derived from run data or manually entered.
 * Clickable to toggle between modes.
 */

import { Sparkles, Pencil, AlertTriangle } from 'lucide-react'
import type { IncomeSource } from '../types'
import type { DerivedIncomeResult, DerivedGrowthRateResult } from './derived-income-calculation'

interface IncomeSourceIndicatorProps {
  source: IncomeSource
  derivedResult: DerivedIncomeResult | DerivedGrowthRateResult | null
  onToggle: () => void
  isDerivable: boolean
  label: 'income' | 'growth'
}

export function IncomeSourceIndicator({
  source,
  derivedResult,
  onToggle,
  isDerivable,
  label,
}: IncomeSourceIndicatorProps) {
  // Non-derivable currencies don't show this indicator
  if (!isDerivable) {
    return null
  }

  const isDerived = source === 'derived'
  const hasSufficientData = derivedResult?.hasSufficientData ?? false
  const hasNoData = derivedResult === null

  const tooltipContent = getTooltipContent(
    isDerived,
    hasSufficientData,
    hasNoData,
    derivedResult
  )

  const indicatorContent = getIndicatorContent(isDerived, hasSufficientData, hasNoData)

  return (
    <button
      type="button"
      onClick={onToggle}
      title={tooltipContent}
      className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs transition-colors ${indicatorContent.className}`}
      aria-label={`${label} source: ${indicatorContent.label}. ${tooltipContent}`}
    >
      {indicatorContent.icon}
      <span className="hidden sm:inline">{indicatorContent.label}</span>
    </button>
  )
}

function getIndicatorContent(
  isDerived: boolean,
  hasSufficientData: boolean,
  hasNoData: boolean
): { icon: React.ReactNode; label: string; className: string } {
  if (isDerived && hasNoData) {
    return {
      icon: <AlertTriangle className="h-3 w-3" />,
      label: 'No data',
      className: 'text-amber-400 hover:bg-amber-400/10',
    }
  }

  if (isDerived && !hasSufficientData) {
    return {
      icon: <AlertTriangle className="h-3 w-3" />,
      label: 'Auto',
      className: 'text-amber-400 hover:bg-amber-400/10',
    }
  }

  if (isDerived) {
    return {
      icon: <Sparkles className="h-3 w-3" />,
      label: 'Auto',
      className: 'text-blue-400 hover:bg-blue-400/10',
    }
  }

  return {
    icon: <Pencil className="h-3 w-3" />,
    label: 'Manual',
    className: 'text-slate-400 hover:bg-slate-400/10',
  }
}

function getTooltipContent(
  isDerived: boolean,
  hasSufficientData: boolean,
  hasNoData: boolean,
  derivedResult: DerivedIncomeResult | DerivedGrowthRateResult | null
): string {
  if (!isDerived) {
    return 'Click to use auto-calculated value from run data'
  }

  if (hasNoData) {
    return 'No run data available. Import runs to enable auto-calculation. Click for manual entry.'
  }

  if (!hasSufficientData) {
    const dataInfo = getDataInfo(derivedResult)
    return `Limited data: ${dataInfo}. Click for manual entry.`
  }

  const dataInfo = getDataInfo(derivedResult)
  return `Auto-calculated from ${dataInfo}. Click for manual entry.`
}

function getDataInfo(
  result: DerivedIncomeResult | DerivedGrowthRateResult | null
): string {
  if (!result) return 'no data'

  if ('daysOfData' in result) {
    const incomeResult = result as DerivedIncomeResult
    return `${incomeResult.daysOfData} day${incomeResult.daysOfData !== 1 ? 's' : ''}, ${incomeResult.runsAnalyzed} run${incomeResult.runsAnalyzed !== 1 ? 's' : ''}`
  }

  const growthResult = result as DerivedGrowthRateResult
  return `${growthResult.weeksOfData} week${growthResult.weeksOfData !== 1 ? 's' : ''}`
}
