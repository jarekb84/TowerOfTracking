import * as React from "react"
import { cn } from "../../shared/lib/utils"

interface TooltipContentWrapperProps {
  children: React.ReactNode
  className?: string
  /**
   * Visual variant for tooltip content
   * @default 'default'
   *
   * - `default`: Simple explanatory tooltips (labels, button hints, short descriptions)
   * - `detailed`: Complex structured data tooltips (stats, metrics, multi-line content)
   */
  variant?: 'default' | 'detailed'
}

/**
 * Reusable tooltip content wrapper with consistent styling across the application.
 *
 * This component provides:
 * - Consistent dark theme styling (`bg-slate-950`)
 * - Proper contrast borders (`border-slate-600/80`)
 * - Smooth entrance animations (`slide-in-from-bottom-1`)
 * - Variant-based sizing and padding
 *
 * @example
 * ```tsx
 * // Simple tooltip
 * <TooltipContentWrapper>
 *   Click to see more details
 * </TooltipContentWrapper>
 *
 * // Detailed stats tooltip
 * <TooltipContentWrapper variant="detailed">
 *   <div>Value: 1000</div>
 *   <div>Rate: 500/hr</div>
 * </TooltipContentWrapper>
 * ```
 */
export function TooltipContentWrapper({
  children,
  className,
  variant = 'default'
}: TooltipContentWrapperProps) {
  const baseStyles = "rounded-lg bg-slate-950 shadow-lg border border-slate-600/80 animate-in fade-in-0 slide-in-from-bottom-1 duration-200"

  const variantStyles = {
    default: "max-w-sm px-3 py-2 text-sm text-slate-100",
    detailed: "min-w-[220px] p-4"
  }

  return (
    <div className={cn(baseStyles, variantStyles[variant], className)}>
      {children}
    </div>
  )
}
