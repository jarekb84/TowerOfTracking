/**
 * Cost Distribution Chart
 *
 * Visualizes the distribution of shard costs from simulation results.
 */

import type { CostStatistics, HistogramBucket } from '../types';
import { formatCost, formatPercentage } from './results-formatters';

interface CostDistributionChartProps {
  statistics: CostStatistics;
  histogram: HistogramBucket[];
}

export function CostDistributionChart({
  statistics,
  histogram,
}: CostDistributionChartProps) {
  return (
    <div className="space-y-4">
      {/* Percentile Summary */}
      <PercentileSummary statistics={statistics} />

      {/* Histogram */}
      <Histogram buckets={histogram} />
    </div>
  );
}

interface PercentileSummaryProps {
  statistics: CostStatistics;
}

function PercentileSummary({ statistics }: PercentileSummaryProps) {
  return (
    <div className="space-y-3">
      {/* Main stats row - 2 cols on very small, 4 cols on sm+ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
        <StatBox
          label="Good"
          sublabel="25th pctl"
          value={statistics.percentile25}
          color="text-emerald-400"
        />
        <StatBox
          label="Typical"
          sublabel="Median"
          value={statistics.median}
          color="text-amber-400"
          highlight
        />
        <StatBox
          label="Pessimistic"
          sublabel="75th pctl"
          value={statistics.percentile75}
          color="text-orange-400"
        />
        <StatBox
          label="Worst"
          sublabel="95th pctl"
          value={statistics.percentile95}
          color="text-red-400"
        />
      </div>

      {/* Range info */}
      <div className="flex justify-between text-xs text-slate-500 px-1">
        <span>Min: {formatCost(statistics.min)}</span>
        <span>Max: {formatCost(statistics.max)}</span>
      </div>
    </div>
  );
}

interface StatBoxProps {
  label: string;
  sublabel: string;
  value: number;
  color: string;
  highlight?: boolean;
}

function StatBox({ label, sublabel, value, color, highlight }: StatBoxProps) {
  return (
    <div
      className={`text-center px-1.5 py-2 sm:px-2 sm:py-2.5 rounded-lg transition-colors ${
        highlight
          ? 'bg-amber-500/10 border border-amber-500/30'
          : 'bg-slate-800/30 border border-slate-700/30'
      }`}
    >
      <div className="text-[10px] sm:text-xs text-slate-400 font-medium truncate">{label}</div>
      <div className={`text-base sm:text-lg font-bold tabular-nums ${color}`}>
        {formatCost(value)}
      </div>
      <div className="text-[9px] sm:text-[10px] text-slate-500 truncate">{sublabel}</div>
    </div>
  );
}

interface HistogramProps {
  buckets: HistogramBucket[];
}

function Histogram({ buckets }: HistogramProps) {
  if (buckets.length === 0) {
    return null;
  }

  const maxCount = Math.max(...buckets.map((b) => b.count));
  // Last bucket may contain outliers (values above p95)
  const lastBucket = buckets[buckets.length - 1];
  const hasOutliers = lastBucket && lastBucket.max > lastBucket.min * 2;

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-slate-400">Cost Distribution</h4>
      <div className="flex items-end gap-0.5 h-28 px-1">
        {buckets.map((bucket, i) => {
          const height = maxCount > 0 ? (bucket.count / maxCount) * 100 : 0;
          const isLastBucket = i === buckets.length - 1;

          return (
            <div
              key={i}
              className="flex-1 group relative h-full flex flex-col justify-end"
            >
              <div
                className={`w-full transition-all duration-150 rounded-t ${
                  isLastBucket && hasOutliers
                    ? 'bg-red-500/40 hover:bg-red-500/70'
                    : 'bg-orange-500/50 hover:bg-orange-500/80'
                }`}
                style={{ height: `${height}%`, minHeight: bucket.count > 0 ? '2px' : '0' }}
              />
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                            hidden group-hover:block z-10 pointer-events-none">
                <div className="bg-slate-900 border border-slate-700 rounded-md px-2.5 py-1.5
                              text-xs whitespace-nowrap shadow-xl">
                  <div className="text-slate-200 font-medium">
                    {formatCost(bucket.min)} - {formatCost(bucket.max)}
                    {isLastBucket && hasOutliers && ' (includes outliers)'}
                  </div>
                  <div className="text-slate-400 mt-0.5">
                    {bucket.count} runs ({formatPercentage(bucket.percentage)})
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-slate-500 px-1">
        <span>{formatCost(buckets[0]?.min ?? 0)}</span>
        <span>{formatCost(buckets[buckets.length - 1]?.max ?? 0)}</span>
      </div>
    </div>
  );
}
