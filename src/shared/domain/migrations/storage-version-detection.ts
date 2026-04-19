import { V3_COLUMN_PREFIX } from './storage-keys';

/**
 * Pure storage-version detection from the raw CSV bytes.
 *
 * V3 CSVs are identified by at least one header starting with
 * `V3_COLUMN_PREFIX` (PRD §9.1 Option C — per-column prefix, no sentinel
 * row). Anything non-empty that doesn't show the prefix is treated as
 * legacy (V1/V2) and needs migration. Empty or whitespace-only input is
 * treated as a fresh install.
 *
 * This function is pure — no localStorage, no I/O. The caller decides
 * where to source the CSV from.
 */

export type StorageVersion = 'empty' | 'legacy' | 'v3';

export function detectStorageVersion(rawCsv: string | null | undefined): StorageVersion {
  if (!rawCsv || !rawCsv.trim()) return 'empty';

  const firstLine = rawCsv.split(/\r?\n/, 1)[0] ?? '';
  if (!firstLine.trim()) return 'empty';

  const headers = firstLine.split('\t');
  const hasV3Prefix = headers.some((h) => h.trim().startsWith(V3_COLUMN_PREFIX));
  return hasV3Prefix ? 'v3' : 'legacy';
}
