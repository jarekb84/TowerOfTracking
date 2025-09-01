import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "./dialog"
import { cn } from "../../shared/lib/utils"

interface ResponsiveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  trigger?: React.ReactNode
  className?: string
}

interface ResponsiveDialogContentProps {
  children: React.ReactNode
  className?: string
  showCloseButton?: boolean
}

interface ResponsiveDialogHeaderProps {
  title: React.ReactNode
  description?: React.ReactNode
  className?: string
}

interface ResponsiveDialogBodyProps {
  children: React.ReactNode
  className?: string
}

interface ResponsiveDialogFooterProps {
  children: React.ReactNode
  className?: string
  mobileLayout?: "1-2" | "2-1" | "equal" | "stacked"
}

export function ResponsiveDialog({ 
  open, 
  onOpenChange, 
  children, 
  trigger,
  className 
}: ResponsiveDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger}
      {/* Pass className to children if they accept it */}
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === ResponsiveDialogContent) {
          return React.cloneElement(child, { 
            className: cn(child.props.className, className) 
          });
        }
        return child;
      })}
    </Dialog>
  )
}

export function ResponsiveDialogContent({ 
  children, 
  className,
  showCloseButton = true 
}: ResponsiveDialogContentProps) {
  return (
    <DialogContent 
      showCloseButton={showCloseButton}
      className={cn(
        // Mobile: Full screen modal
        "fixed inset-0 w-screen h-[100dvh] max-w-[100vw] p-0 m-0 rounded-none",
        "flex flex-col overflow-hidden",
        // Desktop: Centered modal with max dimensions
        "sm:inset-auto sm:top-[50%] sm:left-[50%]",
        "sm:translate-x-[-50%] sm:translate-y-[-50%]",
        "sm:w-full sm:h-auto sm:max-w-4xl sm:max-h-[85vh]",
        "sm:rounded-lg",
        // Remove any conflicting transforms on mobile
        "translate-x-0 translate-y-0",
        className
      )}
    >
      {children}
    </DialogContent>
  )
}

export function ResponsiveDialogHeader({ 
  title, 
  description, 
  className 
}: ResponsiveDialogHeaderProps) {
  return (
    <div className={cn(
      "px-4 py-2.5 sm:px-6 sm:py-4",
      "border-b border-border/50",
      "shrink-0 w-full",
      className
    )}>
      <DialogHeader className="space-y-1">
        <DialogTitle className="text-lg sm:text-xl font-semibold tracking-tight">
          {title}
        </DialogTitle>
        {description && (
          <DialogDescription className="text-sm text-muted-foreground/80">
            {description}
          </DialogDescription>
        )}
      </DialogHeader>
    </div>
  )
}

export function ResponsiveDialogBody({ 
  children, 
  className 
}: ResponsiveDialogBodyProps) {
  return (
    <div className={cn(
      "flex-1 overflow-y-auto overflow-x-hidden",
      "px-4 py-5 sm:px-6 sm:py-6",
      "min-h-0 w-full",
      className
    )}>
      {children}
    </div>
  )
}

export function ResponsiveDialogFooter({ 
  children, 
  className,
  mobileLayout = "1-2"
}: ResponsiveDialogFooterProps) {
    // Apply mobile-specific layouts based on the prop
  const mobileLayoutClasses = {
    "1-2": "[&>:first-child]:w-1/3 [&>:last-child]:w-2/3",
    "2-1": "[&>:first-child]:w-2/3 [&>:last-child]:w-1/3",
    "equal": "[&>*]:flex-1",
    "stacked": "flex-col [&>*]:w-full"
  }
  
  return (
    <div className={cn(
      "px-4 py-4 sm:px-6 sm:py-5",
      "border-t border-border/50 bg-background/50 backdrop-blur-sm",
      "shrink-0 w-full",
      className
    )}>
      <DialogFooter className={cn(
        "gap-2 flex",
        mobileLayout === "stacked" ? "flex-col-reverse" : "flex-row",
        "sm:flex-row sm:justify-end",
        mobileLayout !== "stacked" && mobileLayoutClasses[mobileLayout],
        "sm:[&>*]:w-auto"
      )}>
        {children}
      </DialogFooter>
    </div>
  )
}