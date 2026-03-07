import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { Duration } from '@/shared/domain/filters/types'
import { TIME_PERIOD_CONFIGS } from '../chart-types'
import { useDurationSelector } from './use-duration-selector'

const STORAGE_KEY = 'tower-tracking-time-series-filters'

/** All configs except yearly */
const standardConfigs = TIME_PERIOD_CONFIGS.filter(
  (c) => c.period !== Duration.YEARLY
)

describe('useDurationSelector', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('initial state', () => {
    it('defaults to the provided default period', () => {
      const { result } = renderHook(() =>
        useDurationSelector(Duration.PER_RUN, standardConfigs)
      )

      expect(result.current.selectedPeriod).toBe(Duration.PER_RUN)
    })

    it('hydrates from localStorage on mount', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ duration: 'daily' })
      )

      const { result } = renderHook(() =>
        useDurationSelector(Duration.PER_RUN, standardConfigs)
      )

      expect(result.current.selectedPeriod).toBe(Duration.DAILY)
    })

    it('ignores invalid persisted value', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ duration: 'invalid' })
      )

      const { result } = renderHook(() =>
        useDurationSelector(Duration.PER_RUN, standardConfigs)
      )

      expect(result.current.selectedPeriod).toBe(Duration.PER_RUN)
    })
  })

  describe('setSelectedPeriod', () => {
    it('updates state', () => {
      const { result } = renderHook(() =>
        useDurationSelector(Duration.PER_RUN, standardConfigs)
      )

      act(() => {
        result.current.setSelectedPeriod(Duration.WEEKLY)
      })

      expect(result.current.selectedPeriod).toBe(Duration.WEEKLY)
    })

    it('persists to localStorage', () => {
      const { result } = renderHook(() =>
        useDurationSelector(Duration.PER_RUN, standardConfigs)
      )

      act(() => {
        result.current.setSelectedPeriod(Duration.WEEKLY)
      })

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
      expect(stored.duration).toBe('weekly')
    })
  })

  describe('auto-reset when period unavailable', () => {
    it('resets to first available when selected period is removed', () => {
      const allConfigs = TIME_PERIOD_CONFIGS
      const { result, rerender } = renderHook(
        ({ configs }) => useDurationSelector(Duration.YEARLY, configs),
        { initialProps: { configs: allConfigs } }
      )

      // Yearly is available initially
      expect(result.current.selectedPeriod).toBe(Duration.YEARLY)

      // Remove yearly from available configs
      rerender({ configs: standardConfigs })

      // Should reset to first available (HOURLY)
      expect(result.current.selectedPeriod).toBe(Duration.HOURLY)
    })

    it('keeps selection when period remains available', () => {
      const { result, rerender } = renderHook(
        ({ configs }) => useDurationSelector(Duration.DAILY, configs),
        { initialProps: { configs: standardConfigs } }
      )

      expect(result.current.selectedPeriod).toBe(Duration.DAILY)

      // Re-render with same configs
      rerender({ configs: standardConfigs })

      expect(result.current.selectedPeriod).toBe(Duration.DAILY)
    })
  })
})
