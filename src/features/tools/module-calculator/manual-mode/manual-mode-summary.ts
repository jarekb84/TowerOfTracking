/**
 * Manual Mode Summary
 *
 * Generates collapsed header summary for the Manual Practice Mode panel.
 */

/**
 * Generate collapsed header summary for Manual Practice Mode panel
 * Format: "43 rolls | 12,450 shards spent" or "Ready to practice"
 */
export function generatePracticeModeSummary(
  isActive: boolean,
  rollCount: number,
  totalSpent: number
): string {
  if (!isActive) {
    return 'Ready to practice';
  }

  if (rollCount === 0) {
    return 'Session started';
  }

  const rollsText = `${rollCount} roll${rollCount !== 1 ? 's' : ''}`;
  const shardsText = `${totalSpent.toLocaleString()} shards`;

  return `${rollsText} | ${shardsText}`;
}
