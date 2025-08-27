import { cn } from "../../shared/lib/utils"

interface FormLabelProps {
  children: React.ReactNode
  htmlFor?: string
  required?: boolean
  className?: string
}

export function FormLabel({ children, htmlFor, required, className }: FormLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        "text-sm font-medium text-slate-400",
        className
      )}
    >
      {children}
      {required && <span className="ml-1 text-destructive">*</span>}
    </label>
  )
}