import { useState, useCallback, useMemo } from 'react'
import { GlobalDataInputContext, GlobalDataInputContextType } from '../hooks/use-global-data-input'

interface GlobalDataInputProviderProps {
  children: React.ReactNode
}

export function GlobalDataInputProvider({ children }: GlobalDataInputProviderProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const openDialog = useCallback(() => {
    setIsDialogOpen(true)
  }, [])

  const closeDialog = useCallback(() => {
    setIsDialogOpen(false)
  }, [])

  const contextValue: GlobalDataInputContextType = useMemo(() => ({
    isDialogOpen,
    openDialog,
    closeDialog,
  }), [isDialogOpen, openDialog, closeDialog])

  return (
    <GlobalDataInputContext.Provider value={contextValue}>
      {children}
    </GlobalDataInputContext.Provider>
  )
}