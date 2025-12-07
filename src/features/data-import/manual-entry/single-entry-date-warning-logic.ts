/**
 * Single Entry Date Warning Logic
 *
 * Pure functions for computing date warning display data.
 * Extracts complexity from the presentational component.
 */

import type { DateIssueInfo } from '@/shared/formatting/date-issue-detection';
import { formatDisplayDateTime } from '@/shared/formatting/date-formatters';

/**
 * Display data computed from DateIssueInfo for the warning component.
 */
export interface DateWarningDisplayData {
  /** Whether to show the warning at all */
  showWarning: boolean;
  /** Title for the warning box */
  title: string;
  /** Whether the issue is a missing battleDate (vs invalid) */
  isMissing: boolean;
  /** Formatted date string for the fix (if fixable) */
  formattedFixDate: string | null;
  /** Whether the fix source is from internal fields */
  isInternalFieldsFix: boolean;
  /** Raw value to display (for validation errors) */
  rawValueDisplay: string;
}

/**
 * Compute display data from DateIssueInfo.
 *
 * Centralizes conditional logic for the warning component.
 *
 * @param dateIssueInfo - The date issue information
 * @returns Display data for the warning component
 */
export function computeDateWarningDisplayData(
  dateIssueInfo: DateIssueInfo
): DateWarningDisplayData {
  const showWarning = dateIssueInfo.hasIssue;
  const isMissing = dateIssueInfo.issueType === 'missing';
  const title = isMissing ? 'Missing Battle Date' : 'Invalid Battle Date';

  // Compute formatted fix date if fixable
  let formattedFixDate: string | null = null;
  if (dateIssueInfo.isFixable && dateIssueInfo.derivedDate) {
    formattedFixDate = formatDisplayDateTime(dateIssueInfo.derivedDate);
  }

  const isInternalFieldsFix = dateIssueInfo.fixSource === 'internal-fields';

  // Format raw value for display
  const rawValueDisplay = dateIssueInfo.validationError?.rawValue
    ? `"${dateIssueInfo.validationError.rawValue}"`
    : '(empty)';

  return {
    showWarning,
    title,
    isMissing,
    formattedFixDate,
    isInternalFieldsFix,
    rawValueDisplay,
  };
}
