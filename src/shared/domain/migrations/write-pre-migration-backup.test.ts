import { beforeEach, describe, expect, it } from 'vitest';
import { ensurePreMigrationBackupWritten } from './write-pre-migration-backup';
import { BACKUP_KEY, DATA_KEY } from './storage-keys';

describe('ensurePreMigrationBackupWritten', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('returns no-legacy-data when nothing is stored', () => {
    expect(ensurePreMigrationBackupWritten()).toBe('no-legacy-data');
    expect(window.localStorage.getItem(BACKUP_KEY)).toBeNull();
  });

  it('copies DATA_KEY into BACKUP_KEY on first call', () => {
    const v2Csv = '_Date\tTier\n2026-04-11\t12';
    window.localStorage.setItem(DATA_KEY, v2Csv);

    expect(ensurePreMigrationBackupWritten()).toBe('written');
    expect(window.localStorage.getItem(BACKUP_KEY)).toBe(v2Csv);
  });

  it('is idempotent: second call leaves the original backup untouched', () => {
    const original = '_Date\tTier\n2026-04-11\t12';
    window.localStorage.setItem(DATA_KEY, original);
    ensurePreMigrationBackupWritten();

    // Simulate a later mutation to DATA_KEY — the gate might fire again.
    window.localStorage.setItem(DATA_KEY, 'SOMETHING_ELSE_ENTIRELY');
    expect(ensurePreMigrationBackupWritten()).toBe('already-existed');
    expect(window.localStorage.getItem(BACKUP_KEY)).toBe(original);
  });

  it('preserves the exact raw bytes (no trimming, no re-encoding)', () => {
    const raw = '_Date\tTier\r\n2026-04-11\t12\r\n\r\n';
    window.localStorage.setItem(DATA_KEY, raw);
    ensurePreMigrationBackupWritten();
    expect(window.localStorage.getItem(BACKUP_KEY)).toBe(raw);
  });
});
