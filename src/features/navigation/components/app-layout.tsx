import { TopNavbar } from './top-navbar'
import { Sidebar } from './sidebar'
import { useNavigation } from '../contexts/navigation-context'
import { DataInput } from '../../data-import/manual-entry/data-input'
import { DataInputErrorBoundary } from '../../data-import/manual-entry/data-input-error-boundary'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { isCollapsed } = useNavigation()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <TopNavbar />
      
      <div className="flex">
        <Sidebar />
        
        {/* Enhanced main content area with responsive margins */}
        <main 
          className={`
            flex-1 transition-all duration-300 ease-out min-h-[calc(100vh-3.5rem)]
            ${isCollapsed ? 'md:ml-16 ml-0' : 'md:ml-64 ml-0'}
          `}
        >
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>
      
      {/* Global DataInput dialog with error boundary */}
      <DataInputErrorBoundary>
        <DataInput />
      </DataInputErrorBoundary>
    </div>
  )
}