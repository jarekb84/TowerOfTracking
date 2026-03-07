/**
 * Prune Period Options
 *
 * Pure function implementing the N+1 bucket rule for data-aware
 * interval count pruning. Removes options that would produce
 * empty or meaningless visualizations.
 */

/**
 * Prune period count options based on how many data periods exist.
 *
 * Algorithm:
 * 1. Include all options where option <= dataPeriodCount
 * 2. Include the first option where option > dataPeriodCount (N+1 bucket)
 * 3. If no options qualify and dataPeriodCount > 0, return [allOptions[0]]
 * 4. If dataPeriodCount is 0, return empty array
 */
export function pruneCountOptions(allOptions: number[], dataPeriodCount: number): number[] {
  if (dataPeriodCount === 0) {
    return []
  }

  const result: number[] = []
  let addedN1Bucket = false

  for (const option of allOptions) {
    if (option <= dataPeriodCount) {
      result.push(option)
    } else if (!addedN1Bucket) {
      result.push(option)
      addedN1Bucket = true
    }
  }

  // If no options qualified but we have data, include the smallest option
  if (result.length === 0 && allOptions.length > 0) {
    result.push(allOptions[0])
  }

  return result
}
