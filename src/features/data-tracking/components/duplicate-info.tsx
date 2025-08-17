import { Card, CardContent } from '../../../components/ui/card';
import type { BatchDuplicateDetectionResult, DuplicateDetectionResult } from '../utils/duplicate-detection';
import type { ParsedGameRun } from '../types/game-run.types';

export type DuplicateResolution = 'new-only' | 'overwrite';

interface DuplicateInfoProps {
  // For single run detection
  singleResult?: DuplicateDetectionResult;
  newRun?: ParsedGameRun;
  
  // For batch detection
  batchResult?: BatchDuplicateDetectionResult;
  
  // Common props
  onResolutionChange: (resolution: DuplicateResolution) => void;
  resolution: DuplicateResolution;
  className?: string;
}

export function DuplicateInfo({
  singleResult,
  newRun,
  batchResult,
  onResolutionChange,
  resolution,
  className
}: DuplicateInfoProps) {
  // Determine if we have any duplicates to handle
  const hasDuplicates = singleResult?.isDuplicate || (batchResult && batchResult.duplicates.length > 0);
  
  if (!hasDuplicates) {
    return null; // No duplicates, no UI needed
  }

  // Calculate stats for display
  const stats = batchResult ? {
    total: batchResult.newRuns.length + batchResult.duplicates.length,
    new: batchResult.newRuns.length,
    duplicates: batchResult.duplicates.length
  } : {
    total: 1,
    new: 0,
    duplicates: 1
  };

  return (
    <Card className={`border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30 ${className}`}>
      <CardContent className="p-4 space-y-4">
        {/* Header with warning icon and title */}
        <div className="flex items-start space-x-3">
          <div className="text-orange-500 mt-0.5 text-lg">⚠️</div>
          <div>
            <div className="font-semibold text-orange-800 dark:text-orange-200">
              {batchResult ? 'Duplicate Runs Detected' : 'Duplicate Run Detected'}
            </div>
            <div className="text-sm text-orange-700 dark:text-orange-300 mt-1">
              {batchResult 
                ? `Found ${stats.duplicates} duplicate${stats.duplicates !== 1 ? 's' : ''} out of ${stats.total} run${stats.total !== 1 ? 's' : ''}.`
                : 'This run appears to match existing data in your collection.'
              }
            </div>
          </div>
        </div>

        {/* Statistics display for batch imports */}
        {batchResult && (
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.total}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Total Runs
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.new}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                New Runs
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {stats.duplicates}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Duplicates
              </div>
            </div>
          </div>
        )}

        {/* Single run comparison for individual imports */}
        {singleResult?.existingRun && newRun && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border overflow-hidden">
            <div className="grid grid-cols-3 gap-4 py-2 px-3 bg-gray-50 dark:bg-gray-700 font-medium text-sm border-b">
              <div>Field</div>
              <div className="text-blue-600 dark:text-blue-400">New Run</div>
              <div className="text-gray-600 dark:text-gray-400">Existing Run</div>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {[
                { label: 'Tier', newVal: newRun.tier.toString(), existingVal: singleResult.existingRun.tier.toString() },
                { label: 'Wave', newVal: newRun.wave.toString(), existingVal: singleResult.existingRun.wave.toString() },
                { label: 'Duration', newVal: formatDuration(newRun.realTime), existingVal: formatDuration(singleResult.existingRun.realTime) },
                { label: 'Import Date', newVal: newRun.timestamp.toLocaleDateString(), existingVal: singleResult.existingRun.timestamp.toLocaleDateString() }
              ].map((row, i) => (
                <div key={i} className="grid grid-cols-3 gap-4 py-2 px-3 text-sm">
                  <div className="font-medium">{row.label}</div>
                  <div className="text-blue-600 dark:text-blue-400">{row.newVal}</div>
                  <div className="text-gray-600 dark:text-gray-400">{row.existingVal}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resolution options */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-orange-800 dark:text-orange-200">
            How would you like to handle {batchResult ? 'these duplicates' : 'this duplicate'}?
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {/* Import New Only Option */}
            <button
              onClick={() => onResolutionChange('new-only')}
              className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                resolution === 'new-only'
                  ? 'border-green-500 bg-green-50 dark:bg-green-950/30'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-green-300 dark:hover:border-green-600'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  resolution === 'new-only'
                    ? 'border-green-500 bg-green-500'
                    : 'border-gray-300 dark:border-gray-600'
                }`}>
                  {resolution === 'new-only' && (
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  )}
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    Import New Only
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {batchResult 
                      ? `Import ${stats.new} new run${stats.new !== 1 ? 's' : ''}, skip duplicates`
                      : 'Skip this duplicate run'
                    }
                  </div>
                </div>
              </div>
              <div className={`text-sm font-semibold ${
                resolution === 'new-only'
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                {batchResult ? `Import ${stats.new}` : 'Skip'}
              </div>
            </button>

            {/* Overwrite Existing Option */}
            <button
              onClick={() => onResolutionChange('overwrite')}
              className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                resolution === 'overwrite'
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-orange-300 dark:hover:border-orange-600'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  resolution === 'overwrite'
                    ? 'border-orange-500 bg-orange-500'
                    : 'border-gray-300 dark:border-gray-600'
                }`}>
                  {resolution === 'overwrite' && (
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  )}
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    Overwrite Existing
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {batchResult 
                      ? `Update existing data, import ${stats.new} new run${stats.new !== 1 ? 's' : ''}`
                      : 'Replace existing run with new data (preserves date/time)'
                    }
                  </div>
                </div>
              </div>
              <div className={`text-sm font-semibold ${
                resolution === 'overwrite'
                  ? 'text-orange-700 dark:text-orange-300'
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                {batchResult ? `Update ${stats.duplicates}` : 'Overwrite'}
              </div>
            </button>
          </div>

          {/* Additional info about date/time preservation */}
          {resolution === 'overwrite' && (
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <div className="text-blue-500 mt-0.5">ℹ️</div>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Note:</strong> Overwriting preserves your existing import dates and times. 
                  Only the game data (coins, cells, etc.) will be updated.
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function for duration formatting
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0) parts.push(`${secs}s`);
  
  return parts.join(' ') || '0s';
}