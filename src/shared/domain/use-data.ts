import { createContext, useContext, useEffect, useState } from 'react';
import type { ParsedGameRun } from '@/shared/types/game-run.types';
import {
  generateCompositeKey,
  generateCompositeKeysSet,
  detectDuplicate,
  detectBatchDuplicates,
  type DuplicateDetectionResult,
  type BatchDuplicateDetectionResult
} from './duplicate-detection/duplicate-detection';
import {
  saveRunsToStorage,
  loadRunsFromStorage,
} from '@/features/data-import/csv-import/csv-persistence';
import { migrateDataIfNeeded } from './data-migrations';

interface MigrationState {
  migrated: boolean;
  fromVersion: number;
  toVersion: number;
  error?: Error | null;
}

interface DataContextType {
  runs: ParsedGameRun[];
  compositeKeys: Set<string>;
  migrationState: MigrationState | null;
  addRun: (run: ParsedGameRun) => void;
  addRuns: (runs: ParsedGameRun[], skipDuplicates?: boolean) => BatchDuplicateDetectionResult;
  removeRun: (id: string) => void;
  updateRun: (id: string, updates: Partial<ParsedGameRun>) => void;
  overwriteRun: (existingRunId: string, newRun: ParsedGameRun, preserveDateTime?: boolean) => void;
  clearAllRuns: () => void;
  checkDuplicate: (run: ParsedGameRun) => DuplicateDetectionResult;
  detectBatchDuplicates: (runs: ParsedGameRun[]) => BatchDuplicateDetectionResult;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function useData(): DataContextType {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

export function useDataProvider(): DataContextType {
  // Load data once during initialization (synchronous to avoid re-render flash)
  const initialData = (() => {
    if (typeof window === 'undefined') {
      return { runs: [], compositeKeys: new Set<string>() };
    }

    try {
      const loadedRuns = loadRunsFromStorage();
      return {
        runs: loadedRuns,
        compositeKeys: generateCompositeKeysSet(loadedRuns)
      };
    } catch (error) {
      console.error('[Data Loading] Failed to load runs from storage:', error);
      return { runs: [], compositeKeys: new Set<string>() };
    }
  })();

  const [runs, setRuns] = useState<ParsedGameRun[]>(initialData.runs);
  const [compositeKeys, setCompositeKeys] = useState<Set<string>>(initialData.compositeKeys);

  // Migration state is computed once during initialization and never changes
  // setMigrationState is intentionally unused - migrations are one-time operations
  const [migrationState] = useState<MigrationState | null>(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      // Perform one-time migration if needed (v1 → v2: add underscores to internal fields)
      const migrationResult = migrateDataIfNeeded();

      if (migrationResult.migrated) {
        console.log(
          `[Data Migration] Successfully migrated from v${migrationResult.fromVersion} to v${migrationResult.toVersion}`,
          '\nInternal fields now use consistent naming (_Date, _Time, _Notes, _Run Type)'
        );
        // TODO: Send PostHog event when analytics is set up
        return {
          migrated: true,
          fromVersion: migrationResult.fromVersion,
          toVersion: migrationResult.toVersion,
          error: null
        };
      }
    } catch (error) {
      console.error('[Data Migration] Failed to migrate data:', error);
      return {
        migrated: false,
        fromVersion: 1,
        toVersion: 2,
        error: error instanceof Error ? error : new Error('Unknown migration error')
      };
    }

    return null;
  });

  const addRun = (run: ParsedGameRun): void => {
    const compositeKey = generateCompositeKey(run);
    setRuns(prev => [run, ...prev].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
    setCompositeKeys(prev => new Set([...prev, compositeKey]));
  };

  const removeRun = (id: string): void => {
    setRuns(prev => {
      const runToRemove = prev.find(run => run.id === id);
      const filteredRuns = prev.filter(run => run.id !== id);
      
      // Remove composite key if run was found
      if (runToRemove) {
        const keyToRemove = generateCompositeKey(runToRemove);
        setCompositeKeys(prevKeys => {
          const newKeys = new Set(prevKeys);
          newKeys.delete(keyToRemove);
          return newKeys;
        });
      }
      
      return filteredRuns;
    });
  };

  const updateRun = (id: string, updates: Partial<ParsedGameRun>): void => {
    setRuns(prev => {
      const updatedRuns = prev.map(run => {
        if (run.id === id) {
          const oldKey = generateCompositeKey(run);
          const updatedRun = { ...run, ...updates };
          const newKey = generateCompositeKey(updatedRun);
          
          // Update composite keys if the key changed
          if (oldKey !== newKey) {
            setCompositeKeys(prevKeys => {
              const newKeys = new Set(prevKeys);
              newKeys.delete(oldKey);
              newKeys.add(newKey);
              return newKeys;
            });
          }
          
          return updatedRun;
        }
        return run;
      });
      
      return updatedRuns;
    });
  };

  const clearAllRuns = (): void => {
    setRuns([]);
    setCompositeKeys(new Set());
  };

  // Bulk add runs with duplicate detection
  const addRuns = (newRuns: ParsedGameRun[], skipDuplicates: boolean = false): BatchDuplicateDetectionResult => {
    const result = detectBatchDuplicates(newRuns, compositeKeys, runs);
    
    if (skipDuplicates) {
      // Only add the new unique runs
      if (result.newRuns.length > 0) {
        setRuns(prev => [...result.newRuns, ...prev].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
        setCompositeKeys(prev => new Set([...prev, ...result.compositeKeys]));
      }
    } else {
      // Add all runs (caller will handle duplicate resolution UI)
      setRuns(prev => [...newRuns, ...prev].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
      setCompositeKeys(prev => new Set([...prev, ...newRuns.map(generateCompositeKey)]));
    }
    
    return result;
  };

  // Check if a single run is a duplicate
  const checkDuplicate = (run: ParsedGameRun): DuplicateDetectionResult => {
    return detectDuplicate(run, compositeKeys, runs);
  };

  // Detect duplicates in a batch without adding them
  const detectBatchDuplicatesMethod = (newRuns: ParsedGameRun[]): BatchDuplicateDetectionResult => {
    return detectBatchDuplicates(newRuns, compositeKeys, runs);
  };

  // Overwrite an existing run with special handling for date/time preservation
  const overwriteRun = (existingRunId: string, newRun: ParsedGameRun, preserveDateTime: boolean = true): void => {
    setRuns(prev => {
      const updatedRuns = prev.map(run => {
        if (run.id === existingRunId) {
          const oldKey = generateCompositeKey(run);
          let finalRun = { ...newRun, id: existingRunId }; // Keep same ID
          
          // Preserve date and time if requested (default behavior)
          if (preserveDateTime) {
            finalRun = {
              ...finalRun,
              timestamp: run.timestamp // Keep existing timestamp
            };
          }
          
          const newKey = generateCompositeKey(finalRun);
          
          // Update composite keys if the key changed
          if (oldKey !== newKey) {
            setCompositeKeys(prevKeys => {
              const newKeys = new Set(prevKeys);
              newKeys.delete(oldKey);
              newKeys.add(newKey);
              return newKeys;
            });
          }
          
          return finalRun;
        }
        return run;
      });
      
      return updatedRuns;
    });
  };

  // Save runs to CSV storage whenever they change
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      saveRunsToStorage(runs);
    } catch (error) {
      console.error('Failed to save runs to CSV storage:', error);
    }
  }, [runs]);

  return {
    runs,
    compositeKeys,
    migrationState,
    addRun,
    addRuns,
    removeRun,
    updateRun,
    overwriteRun,
    clearAllRuns,
    checkDuplicate,
    detectBatchDuplicates: detectBatchDuplicatesMethod,
  };
}

export { DataContext };