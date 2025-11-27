import { useReducer, useEffect, useMemo } from 'react';
import type { LocaleStoreContextType } from './types';
import {
  getImportFormat,
  getDisplayLocale,
  setImportFormat,
  setDisplayLocale,
  subscribe,
} from './locale-store';

/**
 * Hook to access the store-based locale settings.
 * Provides access to both import format and display locale settings.
 *
 * @returns Store-based locale context with import format and display locale
 */
export function useLocaleStore(): LocaleStoreContextType {
  // Force re-render when store changes
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  useEffect(() => {
    return subscribe(forceUpdate);
  }, []);

  return useMemo(
    () => ({
      importFormat: getImportFormat(),
      displayLocale: getDisplayLocale(),
      setImportFormat,
      setDisplayLocale,
    }),
    // Re-create when either changes (subscription triggers forceUpdate)
    [getImportFormat(), getDisplayLocale()]
  );
}
