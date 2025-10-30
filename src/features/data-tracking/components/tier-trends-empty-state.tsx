import { TrendingUp } from 'lucide-react'
import { EmptyState } from '../../../components/ui/empty-state'
import { LoadingState } from '../../../components/ui/loading-state'
import { formatRunTypeFilterDisplay } from '../logic/tier-trends-display'
import type { RunTypeFilter } from '../utils/run-type-filter'

interface TierTrendsEmptyStateProps {
  variant: 'no-data' | 'loading'
  runType?: RunTypeFilter
}

export function TierTrendsEmptyState({ variant, runType }: TierTrendsEmptyStateProps) {
  if (variant === 'loading') {
    return (
      <div
        className="animate-in fade-in duration-300"
        role="status"
        aria-live="polite"
        aria-label="Loading trends analysis"
      >
        <LoadingState rows={3} height="400px" />
      </div>
    )
  }

  const runTypeText = runType ? formatRunTypeFilterDisplay(runType) : ''

  return (
    <div
      className="h-[400px] flex items-center justify-center animate-in fade-in duration-300"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="max-w-md">
        <EmptyState icon={<TrendingUp className="w-8 h-8" />}>
          No tier data available for trends analysis. You need at least 2 {runTypeText} runs in the same tier to see trends.
        </EmptyState>
      </div>
    </div>
  )
}
