import { formatFilenameDateTime } from '@/shared/formatting/date-formatters';

/**
 * Produce the filename used for pre-migration backup downloads.
 * Separate from the trigger so tests can assert naming without touching
 * the DOM.
 */
export function buildBackupFilename(now: Date): string {
  return `tower_tracking_pre_v3_backup_${formatFilenameDateTime(now)}.csv`;
}

/**
 * Trigger a browser file download of the raw pre-migration CSV bytes.
 *
 * Uses an object URL + synthetic anchor click, which works in Chrome,
 * Edge, Firefox, and desktop Safari. The returned promise resolves once
 * the click has been dispatched; actual "did the user save the file" is
 * not something the web platform exposes.
 *
 * Mobile-Safari fallback (showing the content in a textarea) lives in the
 * takeover UI; this function sticks to the happy path and throws when
 * the required APIs are missing so the caller can swap in the fallback.
 */
export function triggerBackupDownload(csvBytes: string, filename: string): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('download unavailable in this environment');
  }
  if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
    throw new Error('URL.createObjectURL unavailable — use the copy-paste fallback');
  }

  const blob = new Blob([csvBytes], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  // Release the blob URL on the next tick so the browser has time to
  // start the download before we invalidate the URL.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
