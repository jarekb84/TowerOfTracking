import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useRunTypeContext } from './use-run-type-context'
import { RunTypeValue } from './types'
import * as TanStackRouter from '@tanstack/react-router'

// Mock TanStack Router hooks
vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual('@tanstack/react-router')
  return {
    ...actual,
    useLocation: vi.fn(),
  }
})

describe('useRunTypeContext', () => {
  const mockUseLocation = vi.mocked(TanStackRouter.useLocation)

  it('should return "tournament" when on /runs page with type=tournament', () => {
    mockUseLocation.mockReturnValue({
      pathname: '/runs',
      search: { type: 'tournament' },
    } as ReturnType<typeof TanStackRouter.useLocation>)

    const { result } = renderHook(() => useRunTypeContext())

    expect(result.current).toBe('tournament')
  })

  it('should return "milestone" when on /runs page with type=milestone', () => {
    mockUseLocation.mockReturnValue({
      pathname: '/runs',
      search: { type: 'milestone' },
    } as ReturnType<typeof TanStackRouter.useLocation>)

    const { result } = renderHook(() => useRunTypeContext())

    expect(result.current).toBe('milestone')
  })

  it('should return RunType.FARM when on /runs page with type=farm', () => {
    mockUseLocation.mockReturnValue({
      pathname: '/runs',
      search: { type: 'farm' },
    } as ReturnType<typeof TanStackRouter.useLocation>)

    const { result } = renderHook(() => useRunTypeContext())

    expect(result.current).toBe('farm')
  })

  it('should return "farm" when on /runs page without type parameter', () => {
    mockUseLocation.mockReturnValue({
      pathname: '/runs',
      search: {},
    } as ReturnType<typeof TanStackRouter.useLocation>)

    const { result } = renderHook(() => useRunTypeContext())

    expect(result.current).toBe('farm')
  })

  it('should return "farm" when on /runs page with invalid type parameter', () => {
    mockUseLocation.mockReturnValue({
      pathname: '/runs',
      search: { type: 'invalid' as unknown as RunTypeValue },
    } as ReturnType<typeof TanStackRouter.useLocation>)

    const { result } = renderHook(() => useRunTypeContext())

    expect(result.current).toBe('farm')
  })

  it('should return "farm" when not on /runs page', () => {
    mockUseLocation.mockReturnValue({
      pathname: '/dashboard',
      search: {},
    } as ReturnType<typeof TanStackRouter.useLocation>)

    const { result } = renderHook(() => useRunTypeContext())

    expect(result.current).toBe('farm')
  })

  it('should return "farm" when on home page', () => {
    mockUseLocation.mockReturnValue({
      pathname: '/',
      search: {},
    } as ReturnType<typeof TanStackRouter.useLocation>)

    const { result } = renderHook(() => useRunTypeContext())

    expect(result.current).toBe('farm')
  })

  it('should ignore type parameter when not on /runs page', () => {
    mockUseLocation.mockReturnValue({
      pathname: '/dashboard',
      search: { type: 'tournament' },
    } as ReturnType<typeof TanStackRouter.useLocation>)

    const { result } = renderHook(() => useRunTypeContext())

    expect(result.current).toBe('farm')
  })

  describe('production environment (with base path)', () => {
    it('should return "tournament" when on /TowerOfTracking/runs page with type=tournament', () => {
      mockUseLocation.mockReturnValue({
        pathname: '/TowerOfTracking/runs',
        search: { type: 'tournament' },
      } as ReturnType<typeof TanStackRouter.useLocation>)

      const { result } = renderHook(() => useRunTypeContext())

      expect(result.current).toBe('tournament')
    })

    it('should return "milestone" when on /TowerOfTracking/runs page with type=milestone', () => {
      mockUseLocation.mockReturnValue({
        pathname: '/TowerOfTracking/runs',
        search: { type: 'milestone' },
      } as ReturnType<typeof TanStackRouter.useLocation>)

      const { result } = renderHook(() => useRunTypeContext())

      expect(result.current).toBe('milestone')
    })

    it('should return "farm" when on /TowerOfTracking/runs page with type=farm', () => {
      mockUseLocation.mockReturnValue({
        pathname: '/TowerOfTracking/runs',
        search: { type: 'farm' },
      } as ReturnType<typeof TanStackRouter.useLocation>)

      const { result } = renderHook(() => useRunTypeContext())

      expect(result.current).toBe('farm')
    })

    it('should return "farm" when on /TowerOfTracking/runs page without type parameter', () => {
      mockUseLocation.mockReturnValue({
        pathname: '/TowerOfTracking/runs',
        search: {},
      } as ReturnType<typeof TanStackRouter.useLocation>)

      const { result } = renderHook(() => useRunTypeContext())

      expect(result.current).toBe('farm')
    })

    it('should ignore type parameter when on /TowerOfTracking/dashboard', () => {
      mockUseLocation.mockReturnValue({
        pathname: '/TowerOfTracking/dashboard',
        search: { type: 'tournament' },
      } as ReturnType<typeof TanStackRouter.useLocation>)

      const { result } = renderHook(() => useRunTypeContext())

      expect(result.current).toBe('farm')
    })
  })
})
