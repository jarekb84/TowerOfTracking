import { useNavigation } from '../contexts/navigation-context'
import { NAVIGATION_SECTIONS } from '../config/navigation-config'
import { useSidebarBehavior } from '../hooks/use-sidebar-behavior'
import { NavIcon } from './nav-icon'
import { NavLink, NavSection, NavCollapseButton } from '../../../components/ui'

export function Sidebar() {
  const { isSidebarOpen, closeSidebar, isCollapsed, toggleCollapsed } = useNavigation()
  const { sidebarRef, firstLinkRef } = useSidebarBehavior({ isSidebarOpen, closeSidebar })

  return (
    <>
      {/* Enhanced mobile backdrop with subtle blur effect */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside 
        id="sidebar-navigation"
        ref={sidebarRef}
        className={`
          fixed top-14 left-0 z-50 h-[calc(100vh-3.5rem)] 
          bg-slate-900/95 backdrop-blur-md border-r border-slate-700/30 
          shadow-2xl shadow-slate-950/50
          transition-all duration-300 ease-out flex flex-col
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          ${isCollapsed ? 'w-16' : 'w-64'}
        `}
        aria-label="Navigation sidebar"
        aria-hidden={!isSidebarOpen && typeof window !== 'undefined' && window.innerWidth < 768}
        role="navigation"
      >
        {/* Enhanced navigation with improved spacing, visual hierarchy, and keyboard support */}
        <nav 
          className="flex-1 overflow-y-auto py-6 px-1 nav-slide-in" 
          aria-label="Main navigation"
          role="navigation"
        >
          {NAVIGATION_SECTIONS.map((section, sectionIndex) => (
            <NavSection
              key={section.id}
              id={section.id}
              label={section.label}
              isCollapsed={isCollapsed}
              showDivider={sectionIndex > 0}
            >
              {section.items.map((item, itemIndex) => (
                <li key={item.id}>
                  <NavLink
                    ref={sectionIndex === 0 && itemIndex === 0 ? firstLinkRef : undefined}
                    to={item.href || '#'}
                    onClick={closeSidebar}
                    aria-label={isCollapsed ? item.label : undefined}
                    title={isCollapsed ? item.label : undefined}
                  >
                    {item.icon && (
                      <NavIcon 
                        type={item.icon} 
                        className={`w-4 h-4 flex-shrink-0 transition-colors duration-200 ${isCollapsed ? 'mx-auto' : ''}`} 
                      />
                    )}
                    
                    {!isCollapsed && (
                      <span className="truncate transition-opacity duration-200">
                        {item.label}
                      </span>
                    )}
                  </NavLink>
                </li>
              ))}
            </NavSection>
          ))}
        </nav>

        {/* Enhanced collapse toggle - desktop only */}
        <div className="hidden md:block">
          <NavCollapseButton
            isCollapsed={isCollapsed}
            onClick={toggleCollapsed}
          />
        </div>
      </aside>
    </>
  )
}