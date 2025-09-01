import { createContext, useContext } from 'react'

export interface GlobalDataInputContextType {
  isDialogOpen: boolean
  openDialog: () => void
  closeDialog: () => void
}

export const GlobalDataInputContext = createContext<GlobalDataInputContextType | null>(null)

export function useGlobalDataInput() {
  const context = useContext(GlobalDataInputContext)
  if (!context) {
    throw new Error('useGlobalDataInput must be used within a GlobalDataInputProvider')
  }
  return context
}