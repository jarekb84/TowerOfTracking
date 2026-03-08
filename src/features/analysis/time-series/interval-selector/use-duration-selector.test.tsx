import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { Duration } from '@/shared/domain/filters/types'
import { TIME_PERIOD_CONFIGS } from '../chart-types'
import { useDurationSelector } from './use-duration-selector'
import { resetCache } from '@/shared/persistence/page-state-store'

const STORAGE_KEY = 'tower-tracking-page-state'
const PAGE_SCOPE = 'test/page'

/** All configs except yearly */
const standardConfigs = TIME_PERIOD_CONFIGS.filter(
  (c) => c.period !== Duration.YEARLY
)

describe('useDurationSelector', () => {
  beforeEach(() => {
    localStorage.clear()
    resetCache()
  })

  describe('initial state', () => {
    it('defaults to the provided default period', () => {
      const { result } = renderHook(() =>
        useDurationSelector(Duration.PER_RUN, standardConfigs, PAGE_SCOPE)
      )

      expect(result.current.selectedPeriod).toBe(Duration.PER_RUN)
    })

    it('hydrates from localStorage on mount', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ [PAGE_SCOPE]: { duration: 'daily' } })
      )

      const { result } = renderHook(() =>
        useDurationSelector(Duration.PER_RUN, standardConfigs, PAGE_SCOPE)
      )

      expect(result.current.selectedPeriod).toBe(Duration.DAILY)
    })

    it('auto-resets when persisted value is not in available configs', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ [PAGE_SCOPE]: { duration: 'invalid' } })
      )

      const { result } = renderHook(() =>
        useDurationSelector(Duration.PER_RUN, standardConfigs, PAGE_SCOPE)
      )

      // 'invalid' is not in standardConfigs, so auto-reset fires
      expect(result.current.selectedPeriod).toBe(Duration.HOURLY)
    })
  })

  describe('setSelectedPeriod', () => {
    it('updates state', () => {
      const { result } = renderHook(() =>
        useDurationSelector(Duration.PER_RUN, standardConfigs, PAGE_SCOPE)
      )

      act(() => {
        result.current.setSelectedPeriod(Duration.WEEKLY)
      })

      expect(result.current.selectedPeriod).toBe(Duration.WEEKLY)
    })

    it('persists to localStorage', () => {
      const { result } = renderHook(() =>
        useDurationSelector(Duration.PER_RUN, standardConfigs, PAGE_SCOPE)
      )

      act(() => {
        result.current.setSelectedPeriod(Duration.WEEKLY)
      })

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
      expect(stored[PAGE_SCOPE].duration).toBe('weekly')
    })
  })

  describe('auto-reset when period unavailable', () => {
    it('resets to first available when selected period is removed', () => {
      const allConfigs = TIME_PERIOD_CONFIGS
      const { result, rerender } = renderHook(
        ({ configs }) => useDurationSelector(Duration.YEARLY, configs, PAGE_SCOPE),
        { initialProps: { configs: allConfigs } }
      )

      expect(result.current.selectedPeriod).toBe(Duration.YEARLY)

      rerender({ configs: standardConfigs })

      expect(result.current.selectedPeriod).toBe(Duration.HOURLY)
    })

    it('keeps selection when period remains available', () => {
      const { result, rerender } = renderHook(
        ({ configs }) => useDurationSelector(Duration.DAILY, configs, PAGE_SCOPE),
        { initialProps: { configs: standardConfigs } }
      )

      expect(result.current.selectedPeriod).toBe(Duration.DAILY)

      rerender({ configs: standardConfigs })

      expect(result.current.selectedPeriod).toBe(Duration.DAILY)
    })
  })
})
