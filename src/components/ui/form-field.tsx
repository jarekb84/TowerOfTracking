import { cn } from "../../shared/lib/utils"
import type { SelectorLayout } from "./form-field-types"

interface FormFieldProps {
  children: React.ReactNode
  className?: string
}

export function FormField({ children, className }: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {children}
    </div>
  )
}

interface FormControlProps {
  label: string
  children: React.ReactNode
  required?: boolean
  className?: string
  labelClassName?: string
  controlsClassName?: string
  layout?: SelectorLayout
  labelWidth?: string
}

export function FormControl({ 
  label, 
  children, 
  required, 
  className, 
  labelClassName,
  controlsClassName,
  layout = 'auto',
  labelWidth = 'min-w-fit'
}: FormControlProps) {
  const layoutClasses = {
    horizontal: 'flex flex-row items-center',
    vertical: 'flex flex-col items-start',
    auto: 'flex flex-col sm:flex-row sm:items-center'
  };
  
  return (
    <div className={cn(layoutClasses[layout], "gap-2", className)}>
      <span className={cn(
        "text-sm text-muted-foreground font-medium shrink-0",
        labelWidth,
        labelClassName
      )}>
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </span>
      <div className={cn("flex-1 min-w-0", controlsClassName)}>
        {children}
      </div>
    </div>
  )
}