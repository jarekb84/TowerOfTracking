/**
 * Collapse State Hook
 *
 * Manages collapse/expand state for collapsible cards in the module calculator
 * right panel. Persists state to localStorage.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  loadCollapseState,
  saveCollapseState,
  type CollapseState,
} from './collapse-state-persistence';

const PERSISTENCE_DEBOUNCE_MS = 300;

export interface UseCollapseStateResult {
  /** Whether each section is expanded */
  isExpanded: {
    targetSummary: boolean;
    simulation: boolean;
    practiceMode: boolean;
    rollLog: boolean;
  };
  /** Toggle functions for each section */
  toggle: {
    targetSummary: () => void;
    simulation: () => void;
    practiceMode: () => void;
    rollLog: () => void;
  };
}

/**
 * Hook for managing collapse state of right panel cards
 */
export function useCollapseState(): UseCollapseStateResult {
  const [state, setState] = useState<CollapseState>(loadCollapseState);

  // Track initialization to avoid saving on first render
  const isInitialized = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Persist state changes with debouncing
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveCollapseState(state);
    }, PERSISTENCE_DEBOUNCE_MS);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [state]);

  const toggleTargetSummary = useCallback(() => {
    setState((prev) => ({ ...prev, targetSummary: !prev.targetSummary }));
  }, []);

  const toggleSimulation = useCallback(() => {
    setState((prev) => ({ ...prev, simulation: !prev.simulation }));
  }, []);

  const togglePracticeMode = useCallback(() => {
    setState((prev) => ({ ...prev, practiceMode: !prev.practiceMode }));
  }, []);

  const toggleRollLog = useCallback(() => {
    setState((prev) => ({ ...prev, rollLog: !prev.rollLog }));
  }, []);

  return {
    isExpanded: state,
    toggle: {
      targetSummary: toggleTargetSummary,
      simulation: toggleSimulation,
      practiceMode: togglePracticeMode,
      rollLog: toggleRollLog,
    },
  };
}
