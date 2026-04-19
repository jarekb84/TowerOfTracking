import { BACKUP_KEY, DATA_KEY } from './storage-keys';

/**
 * Synchronously copy the current legacy CSV bytes into the pre-migration
 * backup key, if (a) we're in a browser, (b) the data key actually has
 * legacy content, and (c) the backup key has not already been written.
 *
 * Idempotent: calling twice is a no-op on the second call. This matters
 * because the gate hook's state initializer may fire more than once during
 * StrictMode mounting; we must never overwrite a real backup with stale or
 * partially-migrated data.
 *
 * Called by the migration gate BEFORE any UI renders (PRD F5 / F8). The
 * invariant is: after this function runs on a legacy-data page load, a
 * user who then closes the tab without touching anything has the original
 * V2 CSV bytes preserved under BACKUP_KEY.
 */

export type BackupOutcome = 'written' | 'already-existed' | 'no-legacy-data' | 'ssr';

export function ensurePreMigrationBackupWritten(): BackupOutcome {
  if (typeof window === 'undefined') return 'ssr';
  const storage = window.localStorage;
  if (!storage) return 'ssr';

  const existingBackup = storage.getItem(BACKUP_KEY);
  if (existingBackup !== null && existingBackup.length > 0) {
    return 'already-existed';
  }

  const current = storage.getItem(DATA_KEY);
  if (!current || !current.trim()) {
    return 'no-legacy-data';
  }

  storage.setItem(BACKUP_KEY, current);
  return 'written';
}
