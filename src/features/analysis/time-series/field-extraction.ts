import { ParsedGameRun } from '@/shared/types/game-run.types'

/**
 * Extract numeric value from a ParsedGameRun for any field
 * Handles both cached properties (tier, wave, coinsEarned, cellsEarned, realTime)
 * and dynamic fields from the fields Record
 */
export function extractFieldValue(run: ParsedGameRun, fieldKey: string): number | undefined {
  // Check cached properties first (tier, wave, coinsEarned, cellsEarned, realTime)
  if (fieldKey in run) {
    const value = (run as unknown as Record<string, unknown>)[fieldKey]
    return typeof value === 'number' ? value : undefined
  }

  // Check dynamic fields
  const field = run.fields[fieldKey]
  if (!field) return undefined

  // Parse based on data type
  if (field.dataType === 'number') {
    return typeof field.value === 'number' ? field.value : parseFloat(String(field.value))
  }

  if (field.dataType === 'duration') {
    // Duration fields store seconds as number
    return typeof field.value === 'number' ? field.value : undefined
  }

  return undefined
}
