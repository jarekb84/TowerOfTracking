/**
 * Hook for managing sidebar toggle interactions
 */

interface SidebarToggleConfig {
  isCollapsed: boolean
  onToggle: () => void
}

/**
 * Creates props for sidebar toggle elements
 * @param config - The sidebar toggle configuration
 * @returns Props object for toggle elements
 */
export function useSidebarToggleProps(config: SidebarToggleConfig) {
  const { isCollapsed, onToggle } = config

  const getToggleProps = () => ({
    onClick: onToggle,
    title: isCollapsed ? "Expand sidebar" : "Collapse sidebar",
    'aria-label': isCollapsed ? "Expand sidebar" : "Collapse sidebar"
  })

  const getClickableAreaProps = () => ({
    onClick: onToggle,
    title: isCollapsed ? "Expand sidebar" : "Collapse sidebar",
    'aria-label': isCollapsed ? "Expand sidebar" : "Collapse sidebar",
    className: "hidden md:block px-4 py-2 cursor-pointer hover:bg-slate-800/40 transition-all duration-200 group relative",
    role: "button",
    tabIndex: 0,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onToggle()
      }
    }
  })

  return {
    getToggleProps,
    getClickableAreaProps
  }
}