import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useUrlSearchParam } from './use-url-search-param'

// Mock TanStack Router hooks
const mockNavigate = vi.fn()
const mockSearch = { param1: 'value1', param2: 'value2' }

vi.mock('@tanstack/react-router', () => ({
  useSearch: () => mockSearch,
  useNavigate: () => mockNavigate
}))

interface TestSearchParams extends Record<string, unknown> {
  param1?: string
  param2?: string
  param3?: string
}

describe('useUrlSearchParam', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  it('should return current search with defaults merged', () => {
    const { result } = renderHook(() =>
      useUrlSearchParam<TestSearchParams>('/test', { param3: 'default' })
    )

    expect(result.current.search).toEqual({
      param1: 'value1',
      param2: 'value2',
      param3: 'default'
    })
  })

  it('should update search parameters', () => {
    const { result } = renderHook(() =>
      useUrlSearchParam<TestSearchParams>('/test')
    )

    act(() => {
      result.current.updateSearch({ param1: 'newValue' })
    })

    expect(mockNavigate).toHaveBeenCalledWith({
      search: {
        param1: 'newValue',
        param2: 'value2'
      }
    })
  })

  it('should merge new search params with existing ones', () => {
    const { result } = renderHook(() =>
      useUrlSearchParam<TestSearchParams>('/test', { param3: 'default' })
    )

    act(() => {
      result.current.updateSearch({ param2: 'updated', param3: 'modified' })
    })

    expect(mockNavigate).toHaveBeenCalledWith({
      search: {
        param1: 'value1',
        param2: 'updated',
        param3: 'modified'
      }
    })
  })

  it('should work without default values', () => {
    const { result } = renderHook(() =>
      useUrlSearchParam<TestSearchParams>('/test')
    )

    expect(result.current.search).toEqual({
      param1: 'value1',
      param2: 'value2'
    })
  })
})