/**
 * Roll Log Settings Persistence
 *
 * Handles localStorage persistence for roll log settings,
 * specifically the "show target matches" preference.
 */

const STORAGE_KEY = 'tower-tracking-module-calc-roll-log-settings';

/**
 * Roll log settings that persist across sessions
 */
interface RollLogSettings {
  /** Whether to show target match indicators (default: true) */
  showTargetMatches: boolean;
}

/**
 * Default settings - target matches shown by default
 */
export function getDefaultRollLogSettings(): RollLogSettings {
  return {
    showTargetMatches: true,
  };
}

/**
 * Validate that the stored settings have all required fields
 */
function isValidRollLogSettings(data: unknown): data is RollLogSettings {
  if (!data || typeof data !== 'object') return false;

  const settings = data as Record<string, unknown>;
  return typeof settings.showTargetMatches === 'boolean';
}

/**
 * Load roll log settings from localStorage
 * Returns default settings if none exists or validation fails
 */
export function loadRollLogSettings(): RollLogSettings {
  if (typeof window === 'undefined') {
    return getDefaultRollLogSettings();
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return getDefaultRollLogSettings();
    }

    const parsed = JSON.parse(stored);
    if (isValidRollLogSettings(parsed)) {
      return parsed;
    }

    return getDefaultRollLogSettings();
  } catch (error) {
    console.warn('Failed to load roll log settings from localStorage:', error);
    return getDefaultRollLogSettings();
  }
}

/**
 * Save roll log settings to localStorage
 */
export function saveRollLogSettings(settings: RollLogSettings): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save roll log settings to localStorage:', error);
  }
}
