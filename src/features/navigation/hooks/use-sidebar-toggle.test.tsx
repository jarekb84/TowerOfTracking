import { describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useSidebarToggleProps } from './use-sidebar-toggle'

describe('useSidebarToggleProps', () => {
  it('should return correct props when sidebar is collapsed', () => {
    const mockOnToggle = vi.fn()
    const { result } = renderHook(() => 
      useSidebarToggleProps({
        isCollapsed: true,
        onToggle: mockOnToggle
      })
    )

    const toggleProps = result.current.getToggleProps()
    expect(toggleProps.onClick).toBe(mockOnToggle)
    expect(toggleProps.title).toBe("Expand sidebar")
    expect(toggleProps['aria-label']).toBe("Expand sidebar")
  })

  it('should return correct props when sidebar is expanded', () => {
    const mockOnToggle = vi.fn()
    const { result } = renderHook(() => 
      useSidebarToggleProps({
        isCollapsed: false,
        onToggle: mockOnToggle
      })
    )

    const toggleProps = result.current.getToggleProps()
    expect(toggleProps.onClick).toBe(mockOnToggle)
    expect(toggleProps.title).toBe("Collapse sidebar")
    expect(toggleProps['aria-label']).toBe("Collapse sidebar")
  })

  it('should return clickable area props with correct styling', () => {
    const mockOnToggle = vi.fn()
    const { result } = renderHook(() => 
      useSidebarToggleProps({
        isCollapsed: true,
        onToggle: mockOnToggle
      })
    )

    const clickableAreaProps = result.current.getClickableAreaProps()
    expect(clickableAreaProps.onClick).toBe(mockOnToggle)
    expect(clickableAreaProps.className).toContain('hidden md:block')
    expect(clickableAreaProps.className).toContain('cursor-pointer')
    expect(clickableAreaProps.className).toContain('hover:bg-slate-800/40')
    expect(clickableAreaProps.className).toContain('transition-all duration-200')
  })

  it('should handle toggle function correctly', () => {
    const mockOnToggle = vi.fn()
    const { result } = renderHook(() => 
      useSidebarToggleProps({
        isCollapsed: false,
        onToggle: mockOnToggle
      })
    )

    const toggleProps = result.current.getToggleProps()
    toggleProps.onClick()
    
    expect(mockOnToggle).toHaveBeenCalledTimes(1)
  })

  it('should maintain consistent interface between toggle and clickable area', () => {
    const mockOnToggle = vi.fn()
    const { result } = renderHook(() => 
      useSidebarToggleProps({
        isCollapsed: true,
        onToggle: mockOnToggle
      })
    )

    const toggleProps = result.current.getToggleProps()
    const clickableAreaProps = result.current.getClickableAreaProps()

    expect(toggleProps.onClick).toBe(clickableAreaProps.onClick)
    expect(toggleProps.title).toBe(clickableAreaProps.title)
    expect(toggleProps['aria-label']).toBe(clickableAreaProps['aria-label'])
  })

  it('should update props when isCollapsed state changes', () => {
    const mockOnToggle = vi.fn()
    const { result, rerender } = renderHook(
      ({ isCollapsed }) => useSidebarToggleProps({
        isCollapsed,
        onToggle: mockOnToggle
      }),
      { initialProps: { isCollapsed: true } }
    )

    // Initially collapsed
    let toggleProps = result.current.getToggleProps()
    expect(toggleProps.title).toBe("Expand sidebar")

    // Rerender with expanded state
    rerender({ isCollapsed: false })
    toggleProps = result.current.getToggleProps()
    expect(toggleProps.title).toBe("Collapse sidebar")
  })
})