import { useCallback, useEffect, useState } from 'react';
import {
  BACKUP_CONFIRMED_KEY,
  DATA_KEY,
  LAST_BACKUP_AT_KEY,
  RUNS_SINCE_LAST_BACKUP_KEY,
} from '@/shared/domain/migrations/storage-keys';
import {
  migrateV2CsvToV3,
  type MigrationResult,
} from '@/shared/domain/migrations/v2-to-v3-migrator';
import { commitV3Migration } from '@/shared/domain/migrations/commit-v3-migration';
import {
  buildBackupFilename,
  triggerBackupDownload,
} from './trigger-backup-download';

type TakeoverPhase =
  | 'awaiting-backup'
  | 'awaiting-migration'
  | 'migrating'
  | 'succeeded'
  | 'failed';

export interface TakeoverState {
  phase: TakeoverPhase;
  /** Populated after a successful migration. */
  runCount?: number;
  unrecognizedFields?: string[];
  droppedFields?: string[];
  /** Populated after a failed migration. */
  failingRowIndex?: number;
  failureMessage?: string;
}

function readBackupConfirmed(): boolean {
  if (typeof window === 'undefined') return false;
  const flag = window.localStorage.getItem(BACKUP_CONFIRMED_KEY);
  return typeof flag === 'string' && flag.length > 0;
}

function readRawData(): string {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(DATA_KEY) ?? '';
}

function recordBackupDownloaded(now: Date): void {
  if (typeof window === 'undefined') return;
  const iso = now.toISOString();
  window.localStorage.setItem(BACKUP_CONFIRMED_KEY, iso);
  window.localStorage.setItem(LAST_BACKUP_AT_KEY, iso);
  window.localStorage.setItem(RUNS_SINCE_LAST_BACKUP_KEY, '0');
}

export function useMigrationTakeover(onMigrationCommitted: () => void) {
  const initialPhase: TakeoverPhase = readBackupConfirmed()
    ? 'awaiting-migration'
    : 'awaiting-backup';
  const [state, setState] = useState<TakeoverState>({ phase: initialPhase });

  // Allow the UI to surface whether a backup exists on disk (drives Step 2
  // enablement after a page refresh mid-flow).
  useEffect(() => {
    if (state.phase === 'awaiting-backup' && readBackupConfirmed()) {
      setState({ phase: 'awaiting-migration' });
    }
  }, [state.phase]);

  const downloadBackup = useCallback(() => {
    const raw = readRawData();
    if (!raw) {
      setState({
        phase: 'failed',
        failureMessage: 'No legacy data found to back up.',
      });
      return;
    }

    const now = new Date();
    try {
      triggerBackupDownload(raw, buildBackupFilename(now));
    } catch (error) {
      setState({
        phase: 'failed',
        failureMessage: error instanceof Error ? error.message : 'Backup download failed.',
      });
      return;
    }

    recordBackupDownloaded(now);
    setState({ phase: 'awaiting-migration' });
  }, []);

  const runMigration = useCallback(() => {
    const raw = readRawData();
    setState({ phase: 'migrating' });

    let result: MigrationResult;
    try {
      result = migrateV2CsvToV3(raw);
    } catch (error) {
      setState({
        phase: 'failed',
        failureMessage: error instanceof Error ? error.message : 'Migration threw an error.',
      });
      return;
    }

    if (result.kind === 'error') {
      setState({
        phase: 'failed',
        failingRowIndex: result.rowIndex,
        failureMessage: result.message,
      });
      return;
    }

    try {
      commitV3Migration(result.v3Csv);
    } catch (error) {
      setState({
        phase: 'failed',
        failureMessage: error instanceof Error ? error.message : 'Failed to write migrated data.',
      });
      return;
    }

    setState({
      phase: 'succeeded',
      runCount: result.runCount,
      unrecognizedFields: result.unrecognizedFields,
      droppedFields: result.droppedFields,
    });
    onMigrationCommitted();
  }, [onMigrationCommitted]);

  const retry = useCallback(() => {
    setState({
      phase: readBackupConfirmed() ? 'awaiting-migration' : 'awaiting-backup',
    });
  }, []);

  return { state, downloadBackup, runMigration, retry };
}
