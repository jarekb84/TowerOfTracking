import { Link } from '@tanstack/react-router'
import { useNavigation } from '../navigation-context'
import { useGlobalDataInput } from '@/features/data-import/manual-entry/use-global-data-input'
import { useVersion } from '@/features/versioning'
import { NavIcon } from './nav-icon'
import { COMMUNITY_LINKS, createCommunityLinkClassName } from '../config/community-links'

export function TopNavbar() {
  const { toggleSidebar, isSidebarOpen } = useNavigation()
  const { openDialog } = useGlobalDataInput()
  const version = useVersion()

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-700/30 bg-slate-900/90 backdrop-blur-md shadow-lg shadow-slate-950/20 animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-center justify-between px-4 h-14">
        {/* Left side - hamburger menu (mobile) + title */}
        <div className="flex items-center gap-4">
          {/* Hamburger menu button - mobile only */}
          <button
            onClick={toggleSidebar}
            className="flex md:hidden items-center justify-center w-9 h-9 text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 transition-all duration-200 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50"
            aria-label="Toggle navigation menu"
            aria-expanded={isSidebarOpen}
            aria-controls="sidebar-navigation"
          >
            <svg 
              className="w-5 h-5" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 6h16M4 12h16M4 18h16" 
              />
            </svg>
          </button>

          {/* App title */}
          <Link
            to="/runs"
            className="flex items-center gap-2 font-semibold rounded-lg px-2 py-1 -ml-2 hover:bg-slate-800/40 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
            aria-label="Return to main page - Tower of Tracking"
          >
            <h1 className="flex items-baseline gap-2 text-xl text-slate-100">
              <span>Tower of Tracking</span>
              <span
                className="hidden sm:inline text-xs text-slate-500 font-normal tracking-wide"
                aria-label={`Version ${version}`}
              >
                {version}
              </span>
            </h1>
          </Link>
        </div>

        {/* Center - Community Links - Enhanced responsiveness */}
        <div className="hidden sm:flex items-center gap-3">
          {COMMUNITY_LINKS.map((link) => (
            <a
              key={link.id}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className={createCommunityLinkClassName(link)}
              aria-label={link.ariaLabel}
              title={link.title}
            >
              <NavIcon type={link.icon} className="w-5 h-5" />
            </a>
          ))}
        </div>
        <div className="flex items-center">
          <button
            onClick={openDialog}
            className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-3 sm:px-4 py-2 text-sm font-medium text-slate-900 shadow-md shadow-orange-500/20 hover:bg-orange-400 hover:shadow-lg hover:shadow-orange-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 transition-all duration-200 min-w-[80px] sm:min-w-[140px]"
            aria-label="Add a new game run"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline whitespace-nowrap">Add Game Run</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>
    </header>
  )
}