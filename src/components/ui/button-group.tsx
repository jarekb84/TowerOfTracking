import { cn } from "../../shared/lib/utils"

interface ButtonGroupProps {
  children: React.ReactNode
  className?: string
  vertical?: boolean
  spacing?: 'tight' | 'normal' | 'loose'
  wrap?: boolean
}

export function ButtonGroup({ 
  children, 
  className, 
  vertical = false, 
  spacing = 'normal',
  wrap = true 
}: ButtonGroupProps) {
  const spacingClasses = {
    tight: 'gap-1',
    normal: 'gap-2', 
    loose: 'gap-3'
  };
  
  return (
    <div className={cn(
      "flex",
      spacingClasses[spacing],
      vertical ? "flex-col" : "flex-col sm:flex-row",
      wrap && "flex-wrap",
      className
    )}>
      {children}
    </div>
  )
}