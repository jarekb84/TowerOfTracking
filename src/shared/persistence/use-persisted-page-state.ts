import { useState, useEffect, useCallback, useRef } from 'react'
import { loadPageValue, savePageValue } from './page-state-store'

interface UsePersistedPageStateOptions {
  debounceMs?: number
  validator?: (value: unknown) => boolean
}

export function usePersistedPageState<T>(
  pageScope: string,
  key: string,
  defaultValue: T,
  options?: UsePersistedPageStateOptions
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(defaultValue)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const defaultValueRef = useRef(defaultValue)
  const validatorRef = useRef(options?.validator)
  defaultValueRef.current = defaultValue
  validatorRef.current = options?.validator

  // Hydrate from localStorage on mount and when key/scope changes
  useEffect(() => {
    const fallback = defaultValueRef.current
    const stored = loadPageValue<T>(pageScope, key, fallback)
    if (validatorRef.current && !validatorRef.current(stored)) {
      setState(fallback)
      return
    }
    setState(stored)
  }, [pageScope, key])

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current !== null) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [])

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setState((prev) => {
        const next = typeof value === 'function'
          ? (value as (prev: T) => T)(prev)
          : value

        const persist = () => savePageValue(pageScope, key, next)

        if (options?.debounceMs) {
          if (debounceTimer.current !== null) {
            clearTimeout(debounceTimer.current)
          }
          debounceTimer.current = setTimeout(persist, options.debounceMs)
        } else {
          persist()
        }

        return next
      })
    },
    [pageScope, key, options?.debounceMs]
  )

  return [state, setValue]
}
