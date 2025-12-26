import { FormControl } from '@/components/ui'

interface DataPointsCountProps {
  count: number
  className?: string
}

/**
 * Displays a data points count badge that visually aligns with FormControl labels.
 * Uses FormControl component for consistent layout with Duration and Run Type selectors.
 */
export function DataPointsCount({ count, className = '' }: DataPointsCountProps) {
  return (
    <FormControl label="Data" layout="vertical" className={className}>
      <span className="h-8 [@media(pointer:coarse)]:h-10 inline-flex items-center text-xs text-slate-400 px-2.5 bg-slate-700/40 border border-slate-600/30 rounded-md tabular-nums whitespace-nowrap">
        {count} points
      </span>
    </FormControl>
  )
}
