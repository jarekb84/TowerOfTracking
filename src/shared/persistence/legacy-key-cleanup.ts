const LEGACY_CHART_KEYS = [
  'tower-tracking-time-series-filters',
  'tower-tracking-moving-average-config',
  'tower-tracking-percent-change-config',
]

export function cleanupLegacyChartKeys(): void {
  if (typeof window === 'undefined') return

  for (const key of LEGACY_CHART_KEYS) {
    try {
      localStorage.removeItem(key)
    } catch {
      // Silently fail
    }
  }
}
