import type { 
  ParsedGameRun, 
  TierTrendsFilters, 
  TierTrendsData, 
  FieldTrendData,
  GameRunField 
} from '../types/game-run.types';
// Note: getFieldValue is available but not needed for this implementation

/**
 * Calculate tier trends analysis for the last N farming runs of a specific tier
 */
export function calculateTierTrends(
  runs: ParsedGameRun[], 
  filters: TierTrendsFilters
): TierTrendsData {
  // Filter to farming runs of the specified tier, sorted by timestamp (newest first)
  const tierFarmingRuns = runs
    .filter(run => run.tier === filters.tier && run.runType === 'farm')
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, filters.runCount); // Take the N most recent runs
  
  if (tierFarmingRuns.length < 2) {
    return {
      tier: filters.tier,
      runCount: tierFarmingRuns.length,
      runIds: tierFarmingRuns.map(r => r.id),
      runTimestamps: tierFarmingRuns.map(r => r.timestamp),
      fieldTrends: [],
      summary: {
        totalFields: 0,
        significantChanges: 0,
        topGainers: [],
        topDecliners: []
      }
    };
  }

  // Reverse to get oldest-to-newest order for analysis
  const analyzedRuns = tierFarmingRuns.reverse();
  
  // Get all numerical fields from the runs
  const allNumericalFields = getNumericalFields(analyzedRuns);
  
  // Calculate trends for each field
  const fieldTrends = allNumericalFields.map(fieldName => 
    calculateFieldTrend(analyzedRuns, fieldName, filters.changeThresholdPercent)
  ).filter(trend => trend.significance !== 'low'); // Filter out insignificant changes

  // Generate summary statistics
  const significantChanges = fieldTrends.filter(t => t.significance === 'high').length;
  const topGainers = fieldTrends
    .filter(t => t.change.direction === 'up')
    .sort((a, b) => b.change.percent - a.change.percent)
    .slice(0, 3);
  const topDecliners = fieldTrends
    .filter(t => t.change.direction === 'down')
    .sort((a, b) => a.change.percent - b.change.percent)
    .slice(0, 3);

  return {
    tier: filters.tier,
    runCount: analyzedRuns.length,
    runIds: analyzedRuns.map(r => r.id),
    runTimestamps: analyzedRuns.map(r => r.timestamp),
    fieldTrends: fieldTrends.sort((a, b) => Math.abs(b.change.percent) - Math.abs(a.change.percent)),
    summary: {
      totalFields: allNumericalFields.length,
      significantChanges,
      topGainers,
      topDecliners
    }
  };
}

/**
 * Get all numerical field names that exist across the analyzed runs
 */
function getNumericalFields(runs: ParsedGameRun[]): string[] {
  const allFields = new Set<string>();
  
  for (const run of runs) {
    for (const [fieldName, field] of Object.entries(run.fields)) {
      if (field.dataType === 'number' && typeof field.value === 'number') {
        allFields.add(fieldName);
      }
    }
  }
  
  // Filter out some fields that aren't meaningful for trend analysis
  const excludedFields = new Set(['id', 'timestamp', 'tier', 'runType']);
  
  return Array.from(allFields).filter(field => !excludedFields.has(field));
}

/**
 * Calculate trend data for a specific field across the analyzed runs
 */
function calculateFieldTrend(
  runs: ParsedGameRun[], 
  fieldName: string, 
  thresholdPercent: number
): FieldTrendData {
  const values: number[] = [];
  let displayName = fieldName;
  let dataType: GameRunField['dataType'] = 'number';
  
  // Extract values and metadata
  for (const run of runs) {
    const field = run.fields[fieldName];
    if (field && field.dataType === 'number' && typeof field.value === 'number') {
      values.push(field.value);
      displayName = field.originalKey || fieldName;
      dataType = field.dataType;
    } else {
      // If a run is missing this field, use 0 (could be enhanced to use interpolation)
      values.push(0);
    }
  }
  
  // Calculate change metrics
  const firstValue = values[0];
  const lastValue = values[values.length - 1];
  const absoluteChange = lastValue - firstValue;
  const percentChange = firstValue === 0 ? 
    (lastValue > 0 ? 100 : 0) : 
    (absoluteChange / Math.abs(firstValue)) * 100;
  
  // Determine direction
  const direction = Math.abs(percentChange) < 0.1 ? 'stable' : 
                   percentChange > 0 ? 'up' : 'down';
  
  // Determine significance based on threshold
  const significance = Math.abs(percentChange) >= thresholdPercent * 2 ? 'high' :
                      Math.abs(percentChange) >= thresholdPercent ? 'medium' : 'low';
  
  // Analyze trend type
  const trendType = analyzeTrendType(values);
  
  return {
    fieldName,
    displayName,
    dataType,
    values,
    change: {
      absolute: absoluteChange,
      percent: percentChange,
      direction
    },
    trendType,
    significance
  };
}

/**
 * Analyze the type of trend in the values
 */
function analyzeTrendType(values: number[]): FieldTrendData['trendType'] {
  if (values.length < 3) return 'stable';
  
  // Calculate consecutive differences
  const differences = [];
  for (let i = 1; i < values.length; i++) {
    differences.push(values[i] - values[i - 1]);
  }
  
  // Check for consistent direction
  const positiveChanges = differences.filter(d => d > 0).length;
  const negativeChanges = differences.filter(d => d < 0).length;
  const noChanges = differences.filter(d => d === 0).length;
  
  // If most changes are in one direction, it's linear
  if (positiveChanges >= differences.length * 0.7) return 'upward';
  if (negativeChanges >= differences.length * 0.7) return 'downward';
  if (noChanges >= differences.length * 0.7) return 'stable';
  
  // Check for volatility (many direction changes)
  let directionChanges = 0;
  for (let i = 1; i < differences.length; i++) {
    if ((differences[i] > 0 && differences[i - 1] < 0) || 
        (differences[i] < 0 && differences[i - 1] > 0)) {
      directionChanges++;
    }
  }
  
  if (directionChanges >= differences.length * 0.5) return 'volatile';
  
  return 'linear';
}

/**
 * Get available tiers for trend analysis (tiers with at least 2 farming runs)
 */
export function getAvailableTiersForTrends(runs: ParsedGameRun[]): number[] {
  const tierCounts = new Map<number, number>();
  
  runs
    .filter(run => run.runType === 'farm')
    .forEach(run => {
      tierCounts.set(run.tier, (tierCounts.get(run.tier) || 0) + 1);
    });
  
  return Array.from(tierCounts.entries())
    .filter(([_, count]) => count >= 2)
    .map(([tier, _]) => tier)
    .sort((a, b) => b - a); // Sort descending (highest tiers first)
}

/**
 * Format field names for display
 */
export function formatFieldDisplayName(fieldName: string, originalKey?: string): string {
  if (originalKey) return originalKey;
  
  // Convert camelCase to readable format
  return fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

/**
 * Generate sparkline path data for mini visualizations
 */
export function generateSparklinePath(values: number[], width: number = 60, height: number = 20): string {
  if (values.length < 2) return '';
  
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  
  if (range === 0) {
    // All values are the same - draw horizontal line
    const y = height / 2;
    return `M 0 ${y} L ${width} ${y}`;
  }
  
  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return { x, y };
  });
  
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    path += ` L ${points[i].x} ${points[i].y}`;
  }
  
  return path;
}