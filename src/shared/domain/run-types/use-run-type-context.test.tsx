import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useRunTypeContext } from './use-run-type-context'
import * as TanStackRouter from '@tanstack/react-router'

// Mock TanStack Router hooks
vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual('@tanstack/react-router')
  return {
    ...actual,
    useMatchRoute: vi.fn(),
  }
})

describe('useRunTypeContext', () => {
  const mockUseMatchRoute = TanStackRouter.useMatchRoute as ReturnType<typeof vi.fn>

  // Helper to create a mock matchRoute function that matches specific routes
  function createMatchRouteMock(activeRoute: string | null) {
    return () => (opts: { to: string }) => {
      return activeRoute === opts.to ? {} : false
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('path-based routing', () => {
    it('should return "farm" when on /runs/farm route', () => {
      mockUseMatchRoute.mockImplementation(createMatchRouteMock('/runs/farm'))

      const { result } = renderHook(() => useRunTypeContext())

      expect(result.current).toBe('farm')
    })

    it('should return "tournament" when on /runs/tournament route', () => {
      mockUseMatchRoute.mockImplementation(createMatchRouteMock('/runs/tournament'))

      const { result } = renderHook(() => useRunTypeContext())

      expect(result.current).toBe('tournament')
    })

    it('should return "milestone" when on /runs/milestone route', () => {
      mockUseMatchRoute.mockImplementation(createMatchRouteMock('/runs/milestone'))

      const { result } = renderHook(() => useRunTypeContext())

      expect(result.current).toBe('milestone')
    })
  })

  describe('non-runs routes default to farm', () => {
    it('should return "farm" when on charts route', () => {
      mockUseMatchRoute.mockImplementation(createMatchRouteMock('/charts/coins'))

      const { result } = renderHook(() => useRunTypeContext())

      expect(result.current).toBe('farm')
    })

    it('should return "farm" when on home page', () => {
      mockUseMatchRoute.mockImplementation(createMatchRouteMock('/'))

      const { result } = renderHook(() => useRunTypeContext())

      expect(result.current).toBe('farm')
    })

    it('should return "farm" when no route matches', () => {
      mockUseMatchRoute.mockImplementation(createMatchRouteMock(null))

      const { result } = renderHook(() => useRunTypeContext())

      expect(result.current).toBe('farm')
    })
  })

  describe('useMatchRoute handles basepath automatically', () => {
    // Note: useMatchRoute from TanStack Router automatically handles basepath
    // (e.g., /TowerOfTracking/runs/tournament in production).
    // We don't need separate tests for basepath since the router normalizes routes internally.
    // The mock tests above verify the hook correctly uses the matchRoute function.

    it('should match routes correctly regardless of basepath (handled by router)', () => {
      // When the router is configured with basepath, matchRoute({ to: '/runs/tournament' })
      // will match both /runs/tournament (local) and /TowerOfTracking/runs/tournament (production)
      mockUseMatchRoute.mockImplementation(createMatchRouteMock('/runs/tournament'))

      const { result } = renderHook(() => useRunTypeContext())

      expect(result.current).toBe('tournament')
    })
  })
})
