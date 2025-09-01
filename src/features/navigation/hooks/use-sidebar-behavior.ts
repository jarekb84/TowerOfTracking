import { useEffect, useRef } from 'react'

export interface SidebarBehaviorOptions {
  isSidebarOpen: boolean
  closeSidebar: () => void
}

export function useSidebarBehavior({ isSidebarOpen, closeSidebar }: SidebarBehaviorOptions) {
  const sidebarRef = useRef<HTMLElement>(null)
  const firstLinkRef = useRef<HTMLAnchorElement>(null)

  // Focus management for mobile accessibility
  useEffect(() => {
    if (isSidebarOpen && firstLinkRef.current) {
      firstLinkRef.current.focus()
    }
  }, [isSidebarOpen])

  // Keyboard navigation handling
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isSidebarOpen) {
        closeSidebar()
        // Return focus to hamburger menu for accessibility
        const hamburgerButton = document.querySelector('[aria-label="Toggle navigation menu"]') as HTMLButtonElement
        hamburgerButton?.focus()
      }
    }

    if (isSidebarOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isSidebarOpen, closeSidebar])

  return {
    sidebarRef,
    firstLinkRef
  }
}