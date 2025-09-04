import { createContext, useContext, useState, ReactNode } from 'react'
import { cn } from '../../shared/lib/utils'

interface TabsContextType {
  activeTab: string
  setActiveTab: (value: string) => void
}

const TabsContext = createContext<TabsContextType | undefined>(undefined)

interface TabsProps {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  children: ReactNode
  className?: string
}

export function Tabs({ defaultValue = '', value, onValueChange, children, className }: TabsProps) {
  const [internalActiveTab, setInternalActiveTab] = useState(defaultValue)
  
  // Use controlled mode if value and onValueChange are provided
  const isControlled = value !== undefined && onValueChange !== undefined
  const activeTab = isControlled ? value : internalActiveTab
  
  const setActiveTab = (newValue: string) => {
    if (isControlled) {
      onValueChange?.(newValue)
    } else {
      setInternalActiveTab(newValue)
    }
  }

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={cn('w-full', className)}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

interface TabsListProps {
  children: ReactNode
  className?: string
}

export function TabsList({ children, className }: TabsListProps) {
  return (
    <div 
      className={cn(
        'inline-flex h-10 items-center justify-center rounded-xl bg-slate-800/60 backdrop-blur-sm border border-slate-700/30 p-1.5 text-slate-400 shadow-lg shadow-slate-950/20',
        className
      )}
      role="tablist"
      aria-label="Chart analytics navigation"
    >
      {children}
    </div>
  )
}

interface TabsTriggerProps {
  value: string
  children: ReactNode
  className?: string
}

export function TabsTrigger({ value, children, className }: TabsTriggerProps) {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error('TabsTrigger must be used within a Tabs component')
  }

  const { activeTab, setActiveTab } = context
  const isActive = activeTab === value

  return (
    <button
      onClick={() => setActiveTab(value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          setActiveTab(value)
        }
      }}
      role="tab"
      aria-selected={isActive}
      tabIndex={isActive ? 0 : -1}
      className={cn(
        'relative inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ease-out',
        // Enhanced focus accessibility with better contrast
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800',
        // Keyboard navigation support
        'focus:z-10',
        // Disabled state
        'disabled:pointer-events-none disabled:opacity-50',
        // Active state - subtle but noticeable
        isActive 
          ? 'bg-slate-700/80 text-slate-100 shadow-md shadow-slate-950/30 scale-[1.02]' 
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/40 hover:shadow-sm',
        className
      )}
    >
      {children}
    </button>
  )
}

interface TabsContentProps {
  value: string
  children: ReactNode
  className?: string
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error('TabsContent must be used within a Tabs component')
  }

  const { activeTab } = context
  
  if (activeTab !== value) {
    return null
  }

  return (
    <div className={cn(
      'mt-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50 focus-visible:ring-offset-2',
      // Add subtle animation for content appearance
      'animate-in fade-in-0 slide-in-from-bottom-2 duration-300',
      className
    )}>
      {children}
    </div>
  )
}