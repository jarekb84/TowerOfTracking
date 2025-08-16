import { createContext, useContext, useEffect, useState } from 'react';
import type { ParsedGameRun } from '../types/game-run.types';

interface DataContextType {
  runs: ParsedGameRun[];
  addRun: (run: ParsedGameRun) => void;
  removeRun: (id: string) => void;
  updateRun: (id: string, updates: Partial<ParsedGameRun>) => void;
  clearAllRuns: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const STORAGE_KEY = 'tower-tracking-runs';

export function useData(): DataContextType {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

export function useDataProvider(): DataContextType {
  const [runs, setRuns] = useState<ParsedGameRun[]>([]);
  const [isClient, setIsClient] = useState(false);

  // Initialize client state and load saved runs
  useEffect(() => {
    setIsClient(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Convert timestamp strings back to Date objects
        const runsWithDates = parsed.map((run: any) => ({
          ...run,
          timestamp: new Date(run.timestamp),
          runType: run.runType ?? (run?.camelCaseData?.tier && /\+/.test(run.camelCaseData.tier) ? 'tournament' : 'farm'),
        }));
        setRuns(runsWithDates);
      }
    } catch (error) {
      console.error('Failed to load runs from localStorage:', error);
    }
  }, []);

  const addRun = (run: ParsedGameRun): void => {
    setRuns(prev => [run, ...prev].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
  };

  const removeRun = (id: string): void => {
    setRuns(prev => prev.filter(run => run.id !== id));
  };

  const updateRun = (id: string, updates: Partial<ParsedGameRun>): void => {
    setRuns(prev => prev.map(run => 
      run.id === id ? { ...run, ...updates } : run
    ));
  };

  const clearAllRuns = (): void => {
    setRuns([]);
  };

  // Save runs to localStorage whenever they change
  useEffect(() => {
    if (!isClient) return;
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(runs));
    } catch (error) {
      console.error('Failed to save runs to localStorage:', error);
    }
  }, [runs, isClient]);

  return {
    runs,
    addRun,
    removeRun,
    updateRun,
    clearAllRuns,
  };
}

export { DataContext };
