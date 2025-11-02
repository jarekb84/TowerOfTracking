import { createContext, useContext } from 'react'

interface NavigationContextType {
  isSidebarOpen: boolean
  toggleSidebar: () => void
  closeSidebar: () => void
  isCollapsed: boolean
  toggleCollapsed: () => void
}

export const NavigationContext = createContext<NavigationContextType | null>(null)

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }
  return context
}