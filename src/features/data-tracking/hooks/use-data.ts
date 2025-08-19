import { createContext, useContext, useEffect, useState } from 'react';
import type { ParsedGameRun } from '../types/game-run.types';
import { 
  generateCompositeKey, 
  generateCompositeKeysSet, 
  detectDuplicate, 
  detectBatchDuplicates,
  type DuplicateDetectionResult,
  type BatchDuplicateDetectionResult
} from '../utils/duplicate-detection';
import {
  saveRunsToStorage,
  loadRunsFromStorage,
} from '../utils/csv-persistence';

interface DataContextType {
  runs: ParsedGameRun[];
  compositeKeys: Set<string>;
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
  const [runs, setRuns] = useState<ParsedGameRun[]>([]);
  const [compositeKeys, setCompositeKeys] = useState<Set<string>>(new Set());
  const [isClient, setIsClient] = useState(false);

  // Initialize client state and load saved runs
  useEffect(() => {
    setIsClient(true);
    try {
      const loadedRuns = loadRunsFromStorage();
      setRuns(loadedRuns);
      
      // Generate composite keys set for loaded runs
      setCompositeKeys(generateCompositeKeysSet(loadedRuns));
    } catch (error) {
      console.error('Failed to load runs from CSV storage:', error);
    }
  }, []);

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
    if (!isClient) return;
    
    try {
      saveRunsToStorage(runs);
    } catch (error) {
      console.error('Failed to save runs to CSV storage:', error);
    }
  }, [runs, isClient]);

  return {
    runs,
    compositeKeys,
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