import { cn } from "../../shared/lib/utils"

interface MobileCardProps extends React.ComponentProps<"div"> {
  variant?: 'default' | 'compact' | 'elevated'
  interactive?: boolean
  children: React.ReactNode
}

const cardVariants = {
  default: "border border-border/40 rounded-lg bg-card shadow-sm",
  compact: "border border-border/40 rounded-md bg-card shadow-xs",
  elevated: "border border-border/50 rounded-lg bg-card shadow-lg shadow-black/5 backdrop-blur-sm"
}

const interactiveClasses = "transition-all duration-300 ease-out hover:shadow-xl hover:shadow-black/10 hover:border-accent/50 hover:-translate-y-0.5"

export function MobileCard({ 
  variant = 'default', 
  interactive = false, 
  className, 
  children, 
  ...props 
}: MobileCardProps) {
  return (
    <div 
      className={cn(
        cardVariants[variant],
        interactive && interactiveClasses,
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps extends React.ComponentProps<"div"> {
  children: React.ReactNode
}

export function MobileCardHeader({ className, children, ...props }: CardHeaderProps) {
  return (
    <div 
      className={cn("flex justify-between items-start gap-2", className)}
      {...props}
    >
      {children}
    </div>
  )
}

interface CardContentProps extends React.ComponentProps<"div"> {
  children: React.ReactNode
  spacing?: 'tight' | 'normal' | 'loose'
}

export function MobileCardContent({ 
  spacing = 'normal', 
  className, 
  children, 
  ...props 
}: CardContentProps) {
  const spacingClasses = {
    tight: "space-y-2",
    normal: "space-y-3", 
    loose: "space-y-4"
  }
  
  return (
    <div 
      className={cn(spacingClasses[spacing], className)}
      {...props}
    >
      {children}
    </div>
  )
}

interface CardSectionProps extends React.ComponentProps<"div"> {
  children: React.ReactNode
  title?: string
  subtitle?: string
}

export function MobileCardSection({ 
  title, 
  subtitle, 
  className, 
  children, 
  ...props 
}: CardSectionProps) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {(title || subtitle) && (
        <div className="space-y-1">
          {title && (
            <h4 className="text-sm font-medium text-foreground">{title}</h4>
          )}
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </div>
  )
}