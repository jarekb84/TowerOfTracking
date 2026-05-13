/**
 * TRANSITIONAL — replaced by `HAS_DISPLAY_NAME` edges in commit 7
 * (per-field display names + colors land in the graph alongside
 * `IS_SOURCE_OF`). When that commit ships, this helper is deleted and run-
 * details renders display names via `displayNameOf()` from the graph.
 */

/**
 * Derives a Title-Cased display name from a V3 canonical field id by
 * splitting on the section prefix and Title-Casing the camelCase suffix.
 *
 * Examples:
 *   battleReport_tier        -> 'Tier'
 *   coins_goldenTower        -> 'Golden Tower'
 *   counts_hitsAbsorbedByEnergyShield -> 'Hits Absorbed By Energy Shield'
 *   bonusHealthGained_fromDeathWave   -> 'From Death Wave'
 */
export function deriveDisplayName(fieldId: string): string {
  const underscoreIndex = fieldId.indexOf('_')
  const suffix = underscoreIndex >= 0 ? fieldId.slice(underscoreIndex + 1) : fieldId
  return suffix
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim()
}
