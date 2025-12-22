/**
 * Collapse State Persistence
 *
 * Handles localStorage persistence for collapsible card expand/collapse state
 * in the module calculator right panel.
 */

const STORAGE_KEY = 'tower-tracking-module-calc-collapse-state';

/**
 * Collapse state for each section
 * true = expanded, false = collapsed
 */
export interface CollapseState {
  targetSummary: boolean;
  simulation: boolean;
  practiceMode: boolean;
  rollLog: boolean;
}

/**
 * Default state - Target Summary and Simulation expanded
 */
export function getDefaultCollapseState(): CollapseState {
  return {
    targetSummary: true,
    simulation: true,
    practiceMode: true,
    rollLog: false,
  };
}

/**
 * Validate that the stored state has all required boolean fields
 */
function isValidCollapseState(data: unknown): data is CollapseState {
  if (!data || typeof data !== 'object') return false;

  const state = data as Record<string, unknown>;
  return (
    typeof state.targetSummary === 'boolean' &&
    typeof state.simulation === 'boolean' &&
    typeof state.practiceMode === 'boolean' &&
    typeof state.rollLog === 'boolean'
  );
}

/**
 * Load collapse state from localStorage
 * Returns default state if none exists or validation fails
 */
export function loadCollapseState(): CollapseState {
  if (typeof window === 'undefined') {
    return getDefaultCollapseState();
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return getDefaultCollapseState();
    }

    const parsed = JSON.parse(stored);
    if (isValidCollapseState(parsed)) {
      return parsed;
    }

    return getDefaultCollapseState();
  } catch (error) {
    console.warn('Failed to load collapse state from localStorage:', error);
    return getDefaultCollapseState();
  }
}

/**
 * Save collapse state to localStorage
 */
export function saveCollapseState(state: CollapseState): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save collapse state to localStorage:', error);
  }
}
