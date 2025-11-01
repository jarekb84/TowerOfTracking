import { useMemo } from 'react'
import { NavigationContext } from './navigation-context'
import { useNavigationState } from './use-navigation-state'

interface NavigationProviderProps {
  children: React.ReactNode
}

export function NavigationProvider({ children }: NavigationProviderProps) {
  const navigationState = useNavigationState()
  
  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    isSidebarOpen: navigationState.isSidebarOpen,
    toggleSidebar: navigationState.toggleSidebar,
    closeSidebar: navigationState.closeSidebar,
    isCollapsed: navigationState.isCollapsed,
    toggleCollapsed: navigationState.toggleCollapsed
  }), [navigationState])

  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  )
}