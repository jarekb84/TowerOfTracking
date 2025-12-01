/**
 * Module-level locale store with cached Intl formatters.
 *
 * This store provides:
 * 1. Separation of import format (parsing) from display locale (rendering)
 * 2. Cached Intl.NumberFormat/DateTimeFormat instances for performance
 * 3. Subscription mechanism for React reactivity
 * 4. localStorage persistence with SSR safety
 *
 * Pure functions can import getters directly without prop drilling.
 * React components can use useLocale() hook for reactivity.
 */

import type {
  ImportFormatSettings,
  DisplayLocale,
  LocaleStoreState,
} from './types';

// ============================================================================
// Constants
// ============================================================================

const LOCALE_STORAGE_KEY = 'tower-tracking-locale-v2';

const DEFAULT_IMPORT_FORMAT: ImportFormatSettings = {
  decimalSeparator: '.',
  thousandsSeparator: ',',
  dateFormat: 'month-first',
};

const DEFAULT_DISPLAY_LOCALE: DisplayLocale = 'en-US';

// ============================================================================
// Module-level state (singleton)
// ============================================================================

let state: LocaleStoreState = getInitialState();

// Cached Intl formatters - created once per locale change
let numberFormatter: Intl.NumberFormat | null = null;
let dateFormatter: Intl.DateTimeFormat | null = null;
let dateTimeFormatter: Intl.DateTimeFormat | null = null;

// Subscription listeners for React reactivity
const listeners = new Set<() => void>();

// ============================================================================
// Initialization
// ============================================================================

/**
 * Get initial state from localStorage or defaults.
 * SSR-safe: returns defaults if window is not available.
 */
function getInitialState(): LocaleStoreState {
  if (typeof window === 'undefined') {
    return {
      importFormat: DEFAULT_IMPORT_FORMAT,
      displayLocale: DEFAULT_DISPLAY_LOCALE,
    };
  }

  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as LocaleStoreState;
      if (isValidLocaleState(parsed)) {
        return parsed;
      }
    }
  } catch {
    // Ignore parse errors, use defaults
  }

  // Default: detect browser locale for display
  return {
    importFormat: DEFAULT_IMPORT_FORMAT,
    displayLocale: detectBrowserLocale(),
  };
}

/**
 * Validate that a parsed object is a valid LocaleStoreState.
 */
function isValidLocaleState(obj: unknown): obj is LocaleStoreState {
  if (typeof obj !== 'object' || obj === null) return false;

  const state = obj as LocaleStoreState;

  // Validate importFormat
  if (typeof state.importFormat !== 'object' || state.importFormat === null) {
    return false;
  }
  if (
    state.importFormat.decimalSeparator !== '.' &&
    state.importFormat.decimalSeparator !== ','
  ) {
    return false;
  }
  if (
    state.importFormat.thousandsSeparator !== ',' &&
    state.importFormat.thousandsSeparator !== '.' &&
    state.importFormat.thousandsSeparator !== ' ' &&
    state.importFormat.thousandsSeparator !== ''
  ) {
    return false;
  }
  if (
    state.importFormat.dateFormat !== 'month-first' &&
    state.importFormat.dateFormat !== 'month-first-lowercase'
  ) {
    return false;
  }

  // Validate displayLocale (just check it's a non-empty string)
  if (typeof state.displayLocale !== 'string' || state.displayLocale === '') {
    return false;
  }

  return true;
}

/**
 * Detect browser's preferred locale.
 */
function detectBrowserLocale(): DisplayLocale {
  if (typeof window === 'undefined') return DEFAULT_DISPLAY_LOCALE;

  // Try navigator.language first, fallback to first in languages array
  const locale = navigator.language || navigator.languages?.[0];
  return locale || DEFAULT_DISPLAY_LOCALE;
}

// ============================================================================
// Persistence
// ============================================================================

/**
 * Persist state to localStorage.
 */
function persistState(stateToSave: LocaleStoreState): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, JSON.stringify(stateToSave));
  } catch (error) {
    console.error('[LocaleStore] Failed to persist state:', error);
  }
}

// ============================================================================
// Formatter creation
// ============================================================================

/**
 * Create all Intl formatters for the given locale.
 * Called once when locale changes.
 */
function createFormatters(locale: DisplayLocale): void {
  try {
    // Number formatter for general numbers (e.g., 1,234.56)
    numberFormatter = new Intl.NumberFormat(locale, {
      maximumFractionDigits: 2,
    });

    // Date formatter for date-only display (e.g., Nov 20, 2025)
    dateFormatter = new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    // DateTime formatter for full date+time display (e.g., Nov 20, 2025, 22:28)
    dateTimeFormatter = new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false, // 24-hour time as per user requirement
    });
  } catch (error) {
    console.error('[LocaleStore] Failed to create formatters:', error);
    // Fallback to en-US if locale is invalid
    numberFormatter = new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2,
    });
    dateFormatter = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }
}

/**
 * Invalidate cached formatters, forcing recreation on next access.
 */
function invalidateFormatters(): void {
  numberFormatter = null;
  dateFormatter = null;
  dateTimeFormatter = null;
}

// ============================================================================
// Subscription (for React reactivity)
// ============================================================================

/**
 * Subscribe to store changes.
 * Returns unsubscribe function.
 */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Notify all subscribers of state change.
 */
function notifyListeners(): void {
  listeners.forEach((listener) => listener());
}

// ============================================================================
// Getters
// ============================================================================

/**
 * Get current import format settings.
 * Used for parsing imported game data.
 */
export function getImportFormat(): ImportFormatSettings {
  return state.importFormat;
}

/**
 * Get current display locale.
 * Used for Intl formatting.
 */
export function getDisplayLocale(): DisplayLocale {
  return state.displayLocale;
}

/**
 * Get cached number formatter.
 * Creates formatter on first access or after locale change.
 */
export function getNumberFormatter(): Intl.NumberFormat {
  if (!numberFormatter) {
    createFormatters(state.displayLocale);
  }
  return numberFormatter!;
}

/**
 * Get cached date formatter (date only, no time).
 */
export function getDateFormatter(): Intl.DateTimeFormat {
  if (!dateFormatter) {
    createFormatters(state.displayLocale);
  }
  return dateFormatter!;
}

/**
 * Get cached date+time formatter.
 */
export function getDateTimeFormatter(): Intl.DateTimeFormat {
  if (!dateTimeFormatter) {
    createFormatters(state.displayLocale);
  }
  return dateTimeFormatter!;
}

// ============================================================================
// Setters
// ============================================================================

/**
 * Update import format settings.
 * Persists to localStorage and notifies listeners.
 */
export function setImportFormat(format: ImportFormatSettings): void {
  state = {
    ...state,
    importFormat: format,
  };
  persistState(state);
  notifyListeners();
}

/**
 * Update display locale.
 * Invalidates cached formatters, persists to localStorage, notifies listeners.
 */
export function setDisplayLocale(locale: DisplayLocale): void {
  state = {
    ...state,
    displayLocale: locale,
  };
  invalidateFormatters();
  persistState(state);
  notifyListeners();
}

// ============================================================================
// Testing utilities
// ============================================================================

/**
 * Reset store to initial state (for testing).
 * @internal
 */
export function __resetForTesting(): void {
  state = {
    importFormat: DEFAULT_IMPORT_FORMAT,
    displayLocale: DEFAULT_DISPLAY_LOCALE,
  };
  invalidateFormatters();
  listeners.clear();
}

/**
 * Set state directly (for testing).
 * @internal
 */
export function __setStateForTesting(newState: LocaleStoreState): void {
  state = newState;
  invalidateFormatters();
}
