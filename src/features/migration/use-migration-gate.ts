import { useState } from 'react';
import {
  detectStorageVersion,
  type StorageVersion,
} from '@/shared/domain/migrations/storage-version-detection';
import { ensurePreMigrationBackupWritten } from '@/shared/domain/migrations/write-pre-migration-backup';
import { DATA_KEY } from '@/shared/domain/migrations/storage-keys';

export type MigrationGateStatus = 'pass' | 'blocked';

export interface MigrationGateState {
  status: MigrationGateStatus;
  version: StorageVersion;
}

/**
 * Returns the initial gate state AND synchronously ensures the
 * pre-migration backup is written whenever legacy data is detected.
 *
 * Must run at hook-initializer time — before any effect, before any child
 * mount. That ordering is why the result is computed inside a
 * `useState(() => ...)` initializer rather than inside `useEffect`.
 *
 * SSR-safe: on the server, `window` is undefined; we return a pass-through
 * state and defer actual detection to the client mount.
 */
function computeInitialGateState(): MigrationGateState {
  if (typeof window === 'undefined') {
    return { status: 'pass', version: 'empty' };
  }

  const raw = window.localStorage.getItem(DATA_KEY);
  const version = detectStorageVersion(raw);

  if (version === 'empty' || version === 'v3') {
    return { status: 'pass', version };
  }

  // Legacy data — preserve the raw bytes under BACKUP_KEY before any UI
  // renders. Idempotent; re-running on the next mount is a no-op.
  ensurePreMigrationBackupWritten();
  return { status: 'blocked', version };
}

export function useMigrationGate(): MigrationGateState & {
  markMigrated: () => void;
} {
  const [state, setState] = useState<MigrationGateState>(computeInitialGateState);

  const markMigrated = () => {
    setState({ status: 'pass', version: 'v3' });
  };

  return { ...state, markMigrated };
}
