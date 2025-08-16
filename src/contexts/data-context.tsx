import React, { createContext, useContext, useEffect, useState } from 'react';
import { ParsedGameRun } from '../lib/data-parser';

interface DataContextType {
  runs: ParsedGameRun[];
  addRun: (run: ParsedGameRun) => void;
  removeRun: (id: string) => void;
  updateRun: (id: string, updates: Partial<ParsedGameRun>) => void;
  clearAllRuns: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const STORAGE_KEY = 'tower-tracking-runs';

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [runs, setRuns] = useState<ParsedGameRun[]>(() => {
    // Load runs from localStorage if available (only on client)
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          // Convert timestamp strings back to Date objects
          return parsed.map((run: any) => ({
            ...run,
            timestamp: new Date(run.timestamp),
          }));
        }
      } catch (error) {
        console.error('Failed to load runs from localStorage:', error);
      }
    }
    return [];
  });

  const addRun = (run: ParsedGameRun) => {
    setRuns(prev => [run, ...prev].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
  };

  const removeRun = (id: string) => {
    setRuns(prev => prev.filter(run => run.id !== id));
  };

  const updateRun = (id: string, updates: Partial<ParsedGameRun>) => {
    setRuns(prev => prev.map(run => 
      run.id === id ? { ...run, ...updates } : run
    ));
  };

  const clearAllRuns = () => {
    setRuns([]);
  };

  // Save runs to localStorage whenever they change (only on client)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(runs));
      } catch (error) {
        console.error('Failed to save runs to localStorage:', error);
      }
    }
  }, [runs]);

  return (
    <DataContext.Provider value={{ 
      runs, 
      addRun, 
      removeRun, 
      updateRun, 
      clearAllRuns 
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}