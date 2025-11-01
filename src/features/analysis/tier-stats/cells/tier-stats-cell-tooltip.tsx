import { format } from 'date-fns'
import type { CellTooltipData } from '../types'
import { formatDuration } from '@/features/analysis/shared/parsing/data-parser'
import { formatLargeNumber } from '@/features/analysis/shared/formatting/chart-formatters'
import { TooltipContentWrapper } from '@/components/ui/tooltip-content'

interface TierStatsCellTooltipProps {
  data: CellTooltipData
}

export function TierStatsCellTooltip({ data }: TierStatsCellTooltipProps) {
  return (
    <TooltipContentWrapper variant="detailed" className="shadow-2xl backdrop-blur-md">
      <div className="space-y-3">
        {/* Field Name */}
        <div className="font-semibold text-white text-sm border-b border-slate-700/80 pb-2.5">
          {data.displayName}
          {data.isHourlyRate && <span className="text-slate-300 font-normal"> (Per Hour)</span>}
        </div>

        {/* Value */}
        <div className="flex justify-between items-center gap-4">
          <span className="text-xs text-slate-300 font-medium">Value:</span>
          <span className="text-sm font-mono text-white font-semibold">
            {formatLargeNumber(Math.round(data.value))}
            {data.isHourlyRate && '/h'}
          </span>
        </div>

        {/* Hourly Rate Context */}
        {data.isHourlyRate && data.hourlyRateContext && (
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-md p-2.5 space-y-1.5">
            <div className="flex justify-between items-center gap-4">
              <span className="text-xs text-orange-200">Base Value:</span>
              <span className="font-mono text-xs text-orange-100 font-semibold">
                {formatLargeNumber(Math.round(data.hourlyRateContext.baseValue))}
              </span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-xs text-orange-200">Run Duration:</span>
              <span className="font-mono text-xs text-orange-100 font-semibold">
                {formatDuration(data.hourlyRateContext.runDuration)}
              </span>
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-slate-700/80 pt-3 space-y-2">
          <div className="text-xs text-slate-300 font-medium mb-2">From Run:</div>

          {/* Wave */}
          <div className="flex justify-between items-center gap-4">
            <span className="text-xs text-slate-300">Wave:</span>
            <span className="text-sm font-mono text-white font-medium">
              {data.wave.toLocaleString()}
            </span>
          </div>

          {/* Duration */}
          <div className="flex justify-between items-center gap-4">
            <span className="text-xs text-slate-300">Duration:</span>
            <span className="text-sm font-mono text-white font-medium">
              {formatDuration(data.duration)}
            </span>
          </div>

          {/* Timestamp */}
          <div className="flex justify-between items-center gap-4">
            <span className="text-xs text-slate-300">Date:</span>
            <span className="text-sm font-mono text-white font-medium">
              {format(data.timestamp, 'MM/dd \'at\' h:mm a')}
            </span>
          </div>
        </div>
      </div>
    </TooltipContentWrapper>
  )
}
