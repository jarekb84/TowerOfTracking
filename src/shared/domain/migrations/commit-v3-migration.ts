import { DATA_KEY, VERSION_KEY, V3_COLUMN_PREFIX_VERSION } from './storage-keys';

/**
 * Commit a successful V2 -> V3 migration to localStorage.
 *
 * Separated from the pure migrator (v2-to-v3-migrator.ts) so the pure
 * logic can be tested in isolation and the single localStorage write
 * happens in exactly one place. This is the transactional write point:
 * if the caller encountered any error during the migrator run, it MUST
 * NOT call this function.
 *
 * Order matters. We write DATA_KEY first, VERSION_KEY second. If the user
 * closes the tab between the two writes, on next load the gate still sees
 * V3 data (correct) and the old VERSION_KEY value (stale). The gate
 * tolerates a missing/stale version: version detection is driven by the
 * `v3_` header prefix, not by VERSION_KEY.
 */

export const V3_DATA_VERSION = V3_COLUMN_PREFIX_VERSION;

export function commitV3Migration(v3Csv: string): void {
  if (typeof window === 'undefined') return;
  const storage = window.localStorage;
  if (!storage) return;

  storage.setItem(DATA_KEY, v3Csv);
  storage.setItem(VERSION_KEY, String(V3_DATA_VERSION));
}
