const STORAGE_KEY = 'tower-tracking-page-state'

const cache = new Map<string, Record<string, unknown>>()

function readFromStorage(): Record<string, Record<string, unknown>> {
  if (typeof window === 'undefined') return {}

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return {}
    return JSON.parse(stored) as Record<string, Record<string, unknown>>
  } catch {
    return {}
  }
}

function writeToStorage(data: Record<string, Record<string, unknown>>): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Silently fail on storage errors
  }
}

export function loadPageValue<T>(
  pageScope: string,
  key: string,
  defaultValue: T
): T {
  if (typeof window === 'undefined') return defaultValue

  const cached = cache.get(pageScope)
  if (cached && key in cached) {
    return cached[key] as T
  }

  try {
    const allData = readFromStorage()
    const pageData = allData[pageScope]
    if (pageData) {
      cache.set(pageScope, pageData)
      if (key in pageData) {
        return pageData[key] as T
      }
    }
  } catch {
    // Fall through to default
  }

  return defaultValue
}

export function savePageValue<T>(
  pageScope: string,
  key: string,
  value: T
): void {
  if (typeof window === 'undefined') return

  const pageData = cache.get(pageScope) ?? {}
  pageData[key] = value as unknown
  cache.set(pageScope, pageData)

  const allData = readFromStorage()
  allData[pageScope] = pageData
  writeToStorage(allData)
}

export function clearPageState(pageScope: string): void {
  if (typeof window === 'undefined') return

  cache.delete(pageScope)

  const allData = readFromStorage()
  delete allData[pageScope]
  writeToStorage(allData)
}

export function clearAllPageState(): void {
  if (typeof window === 'undefined') return

  cache.clear()

  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Silently fail
  }
}

export function resetCache(): void {
  cache.clear()
}
