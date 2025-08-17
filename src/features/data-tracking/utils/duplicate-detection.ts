import type { ParsedGameRun } from '../types/game-run.types';

// Tolerance for floating-point number comparisons (to handle minor precision differences)
const FLOAT_TOLERANCE = 0.001;

// Interface for duplicate detection result
export interface DuplicateDetectionResult {
  isDuplicate: boolean;
  existingRun?: ParsedGameRun;
  compositeKey: string;
}

// Interface for duplicate resolution choices
export interface DuplicateResolutionChoice {
  action: 'skip' | 'overwrite';
  applyToAll?: boolean; // For bulk imports
}

// Interface for batch duplicate detection results
export interface BatchDuplicateDetectionResult {
  newRuns: ParsedGameRun[];
  duplicates: Array<{
    newRun: ParsedGameRun;
    existingRun: ParsedGameRun;
    compositeKey: string;
  }>;
  compositeKeys: string[];
}

/**
 * Generate composite key for duplicate detection using simplified strategy
 * 
 * Strategy: tier|wave|realTime (should be unique enough for most cases)
 * Format: "10|5006|7h 45m 33s" - human readable for debugging
 */
export function generateCompositeKey(run: ParsedGameRun): string {
  const tier = run.tier || 0;
  const wave = run.wave || 0;
  const realTime = run.realTime || 0;
  
  // Format realTime as duration string for human readability
  const duration = formatDurationForKey(realTime);
  
  return `${tier}|${wave}|${duration}`;
}

/**
 * Format duration in seconds to a consistent string format for keys
 * Format: "7h 45m 33s" (always includes all units for consistency)
 */
function formatDurationForKey(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return `${hours}h ${minutes}m ${secs}s`;
}

/**
 * Check if a run is a duplicate based on composite key lookup
 */
export function detectDuplicate(
  newRun: ParsedGameRun,
  existingKeys: Set<string>,
  existingRuns: ParsedGameRun[]
): DuplicateDetectionResult {
  const compositeKey = generateCompositeKey(newRun);
  const isDuplicate = existingKeys.has(compositeKey);
  
  let existingRun: ParsedGameRun | undefined;
  if (isDuplicate) {
    // Find the existing run with the same composite key
    existingRun = existingRuns.find(run => generateCompositeKey(run) === compositeKey);
  }
  
  return {
    isDuplicate,
    existingRun,
    compositeKey
  };
}

/**
 * Batch duplicate detection for bulk imports
 * Processes multiple runs and categorizes them as new or duplicates
 */
export function detectBatchDuplicates(
  newRuns: ParsedGameRun[],
  existingKeys: Set<string>,
  existingRuns: ParsedGameRun[]
): BatchDuplicateDetectionResult {
  const result: BatchDuplicateDetectionResult = {
    newRuns: [],
    duplicates: [],
    compositeKeys: []
  };
  
  const processedKeys = new Set<string>();
  
  for (const newRun of newRuns) {
    const compositeKey = generateCompositeKey(newRun);
    
    // Check against existing data
    const isDuplicateOfExisting = existingKeys.has(compositeKey);
    
    // Check against other runs in this batch
    const isDuplicateInBatch = processedKeys.has(compositeKey);
    
    if (isDuplicateOfExisting) {
      // Find existing run
      const existingRun = existingRuns.find(run => generateCompositeKey(run) === compositeKey);
      if (existingRun) {
        result.duplicates.push({
          newRun,
          existingRun,
          compositeKey
        });
      }
    } else if (isDuplicateInBatch) {
      // Skip this run as it's a duplicate within the same batch
      // We already have this data from a previous run in the same import
      continue;
    } else {
      // This is a new unique run
      result.newRuns.push(newRun);
      result.compositeKeys.push(compositeKey);
      processedKeys.add(compositeKey);
    }
  }
  
  return result;
}

/**
 * Generate composite keys for all existing runs
 * Used to create the lookup Set for O(1) duplicate detection
 */
export function generateCompositeKeysSet(runs: ParsedGameRun[]): Set<string> {
  return new Set(runs.map(generateCompositeKey));
}

/**
 * Validate composite key generation
 * Used for testing and debugging key collisions
 */
export function analyzeKeyCollisions(runs: ParsedGameRun[]): {
  totalRuns: number;
  uniqueKeys: number;
  collisions: Array<{
    key: string;
    runs: ParsedGameRun[];
  }>;
} {
  const keyToRuns = new Map<string, ParsedGameRun[]>();
  
  for (const run of runs) {
    const key = generateCompositeKey(run);
    if (!keyToRuns.has(key)) {
      keyToRuns.set(key, []);
    }
    keyToRuns.get(key)!.push(run);
  }
  
  const collisions = Array.from(keyToRuns.entries())
    .filter(([_, runs]) => runs.length > 1)
    .map(([key, runs]) => ({ key, runs }));
  
  return {
    totalRuns: runs.length,
    uniqueKeys: keyToRuns.size,
    collisions
  };
}