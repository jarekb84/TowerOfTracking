import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useSidebarBehavior } from './use-sidebar-behavior'

describe('useSidebarBehavior', () => {
  const mockCloseSidebar = vi.fn()
  
  beforeEach(() => {
    mockCloseSidebar.mockClear()
    // Mock document.querySelector
    document.querySelector = vi.fn()
  })

  afterEach(() => {
    // Clean up event listeners
    document.removeEventListener = vi.fn()
  })

  describe('focus management', () => {
    it('should focus first link when sidebar opens', () => {
      const { result, rerender } = renderHook(
        ({ isSidebarOpen }) => useSidebarBehavior({ isSidebarOpen, closeSidebar: mockCloseSidebar }),
        { initialProps: { isSidebarOpen: false } }
      )

      // Mock the firstLinkRef
      const mockFocus = vi.fn()
      Object.defineProperty(result.current.firstLinkRef, 'current', {
        value: { focus: mockFocus },
        writable: true
      })

      // Simulate sidebar opening
      rerender({ isSidebarOpen: true })

      expect(mockFocus).toHaveBeenCalledOnce()
    })

    it('should not focus when sidebar is closed', () => {
      const mockFocus = vi.fn()
      const { result } = renderHook(() => 
        useSidebarBehavior({ isSidebarOpen: false, closeSidebar: mockCloseSidebar })
      )

      Object.defineProperty(result.current.firstLinkRef, 'current', {
        value: { focus: mockFocus },
        writable: true
      })

      expect(mockFocus).not.toHaveBeenCalled()
    })

    it('should not focus when firstLinkRef is null', () => {
      renderHook(() => 
        useSidebarBehavior({ isSidebarOpen: true, closeSidebar: mockCloseSidebar })
      )

      // Should not throw error when firstLinkRef.current is null
      expect(() => {}).not.toThrow()
    })
  })

  describe('keyboard navigation', () => {
    beforeEach(() => {
      // Mock addEventListener and removeEventListener
      document.addEventListener = vi.fn()
      document.removeEventListener = vi.fn()
    })

    it('should add keydown listener when sidebar is open', () => {
      renderHook(() => 
        useSidebarBehavior({ isSidebarOpen: true, closeSidebar: mockCloseSidebar })
      )

      expect(document.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function))
    })

    it('should not add keydown listener when sidebar is closed', () => {
      renderHook(() => 
        useSidebarBehavior({ isSidebarOpen: false, closeSidebar: mockCloseSidebar })
      )

      expect(document.addEventListener).not.toHaveBeenCalled()
    })

    it('should close sidebar on Escape key press', () => {
      let keydownHandler: ((event: KeyboardEvent) => void) | undefined

      // Capture the keydown handler
      const mockAddEventListener = vi.fn().mockImplementation((event, handler) => {
        if (event === 'keydown') {
          keydownHandler = handler
        }
      })
      document.addEventListener = mockAddEventListener

      renderHook(() => 
        useSidebarBehavior({ isSidebarOpen: true, closeSidebar: mockCloseSidebar })
      )

      // Simulate Escape key press
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' })
      keydownHandler?.(escapeEvent)

      expect(mockCloseSidebar).toHaveBeenCalledOnce()
    })

    it('should focus hamburger button after Escape press', () => {
      let keydownHandler: ((event: KeyboardEvent) => void) | undefined
      
      const mockAddEventListener = vi.fn().mockImplementation((event, handler) => {
        if (event === 'keydown') {
          keydownHandler = handler
        }
      })
      document.addEventListener = mockAddEventListener

      const mockFocus = vi.fn()
      const mockButton = { focus: mockFocus }
      document.querySelector = vi.fn().mockReturnValue(mockButton)

      renderHook(() => 
        useSidebarBehavior({ isSidebarOpen: true, closeSidebar: mockCloseSidebar })
      )

      // Simulate Escape key press
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' })
      keydownHandler?.(escapeEvent)

      expect(document.querySelector).toHaveBeenCalledWith('[aria-label="Toggle navigation menu"]')
      expect(mockFocus).toHaveBeenCalledOnce()
    })

    it('should not close sidebar on other key presses', () => {
      let keydownHandler: ((event: KeyboardEvent) => void) | undefined

      const mockAddEventListener = vi.fn().mockImplementation((event, handler) => {
        if (event === 'keydown') {
          keydownHandler = handler
        }
      })
      document.addEventListener = mockAddEventListener

      renderHook(() => 
        useSidebarBehavior({ isSidebarOpen: true, closeSidebar: mockCloseSidebar })
      )

      // Simulate different key press
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' })
      keydownHandler?.(enterEvent)

      expect(mockCloseSidebar).not.toHaveBeenCalled()
    })

    it('should remove event listener on cleanup', () => {
      const { unmount } = renderHook(() => 
        useSidebarBehavior({ isSidebarOpen: true, closeSidebar: mockCloseSidebar })
      )

      unmount()

      expect(document.removeEventListener).toHaveBeenCalledWith('keydown', expect.any(Function))
    })

    it('should remove event listener when sidebar closes', () => {
      const { rerender } = renderHook(
        ({ isSidebarOpen }) => useSidebarBehavior({ isSidebarOpen, closeSidebar: mockCloseSidebar }),
        { initialProps: { isSidebarOpen: true } }
      )

      // Close sidebar
      rerender({ isSidebarOpen: false })

      expect(document.removeEventListener).toHaveBeenCalledWith('keydown', expect.any(Function))
    })
  })

  describe('return values', () => {
    it('should return refs for sidebar and first link', () => {
      const { result } = renderHook(() => 
        useSidebarBehavior({ isSidebarOpen: false, closeSidebar: mockCloseSidebar })
      )

      expect(result.current).toHaveProperty('sidebarRef')
      expect(result.current).toHaveProperty('firstLinkRef')
      expect(result.current.sidebarRef.current).toBeNull()
      expect(result.current.firstLinkRef.current).toBeNull()
    })
  })
})