/**
 * Module Calculator Persistence Hook
 *
 * Handles loading initial state from localStorage and saving state changes
 * with debouncing to avoid blocking UI during rapid updates.
 */

import { useEffect, useRef } from 'react';
import type { ModuleType, Rarity } from '@/shared/domain/module-data';
import type { EffectSelection, ConfidenceLevel } from '../types';
import type { InitialModuleConfigValues } from '../configuration/use-module-config';
import {
  loadModuleCalcState,
  saveModuleCalcState,
  serializeSelections,
  deserializeSelections,
  type FlatModuleCalcState,
} from './module-calc-persistence';

/** Debounce delay for localStorage saves (matches pattern from use-data.ts) */
const PERSISTENCE_DEBOUNCE_MS = 300;

/**
 * Initial state loaded from localStorage
 */
interface PersistedModuleCalcState {
  configValues: InitialModuleConfigValues;
  selections: Map<string, EffectSelection>;
  confidenceLevel: ConfidenceLevel;
}

/**
 * Current state to persist
 */
interface CurrentModuleCalcState {
  moduleType: ModuleType;
  moduleLevel: number;
  moduleRarity: Rarity;
  selections: Map<string, EffectSelection>;
  confidenceLevel: ConfidenceLevel;
}

/**
 * Load persisted state and prepare initial values for hooks
 */
export function loadPersistedState(): PersistedModuleCalcState {
  const stored = loadModuleCalcState();
  return {
    configValues: {
      moduleType: stored.moduleType,
      moduleLevel: stored.moduleLevel,
      moduleRarity: stored.moduleRarity,
    },
    selections: deserializeSelections(stored.selections),
    confidenceLevel: stored.confidenceLevel,
  };
}

/**
 * Hook for persisting module calculator state to localStorage
 *
 * Saves state changes with debouncing to avoid blocking UI during rapid updates.
 * Skips the first save to avoid overwriting the initially loaded state.
 *
 * NOTE: Initial state loading should be done with `loadPersistedState()` before
 * calling this hook, so that sub-hooks can be initialized with persisted values.
 */
export function useModuleCalcPersistenceSave(
  currentState: CurrentModuleCalcState
): void {
  // Track if we've initialized to avoid saving on first render
  const isInitialized = useRef(false);

  // Ref for debouncing localStorage saves
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Persist state to localStorage whenever relevant values change (debounced)
  useEffect(() => {
    // Skip the first render to avoid overwriting persisted state
    if (!isInitialized.current) {
      isInitialized.current = true;
      return;
    }

    // Clear any pending save to implement debouncing
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce the save operation to avoid blocking UI during rapid changes
    saveTimeoutRef.current = setTimeout(() => {
      const stateToSave: FlatModuleCalcState = {
        moduleType: currentState.moduleType,
        moduleLevel: currentState.moduleLevel,
        moduleRarity: currentState.moduleRarity,
        selections: serializeSelections(currentState.selections),
        confidenceLevel: currentState.confidenceLevel,
        lastUpdated: Date.now(),
      };

      saveModuleCalcState(stateToSave);
    }, PERSISTENCE_DEBOUNCE_MS);

    // Cleanup timeout on unmount or dependency change
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [
    currentState.moduleType,
    currentState.moduleLevel,
    currentState.moduleRarity,
    currentState.selections,
    currentState.confidenceLevel,
  ]);
}
