import * as React from 'react'
import { cn } from '../../shared/lib/utils'
import { Info, AlertCircle, CheckCircle } from 'lucide-react'

interface InfoBoxProps extends React.ComponentProps<'div'> {
  /**
   * Visual variant of the info box
   * - info: Blue info box (default)
   * - success: Green success box
   * - warning: Orange warning box
   */
  variant?: 'info' | 'success' | 'warning'
  /**
   * Optional icon to display (defaults to variant-appropriate icon)
   */
  icon?: React.ReactNode
  /**
   * Optional title/heading
   */
  title?: string
  children: React.ReactNode
}

const variantStyles = {
  info: {
    container: 'bg-blue-500/10 border-blue-500/30',
    title: 'text-blue-200',
    text: 'text-blue-300',
    icon: 'text-blue-300'
  },
  success: {
    container: 'bg-emerald-500/10 border-emerald-500/30',
    title: 'text-emerald-200',
    text: 'text-emerald-400',
    icon: 'text-emerald-400'
  },
  warning: {
    container: 'bg-orange-500/10 border-orange-500/30',
    title: 'text-orange-200',
    text: 'text-orange-300',
    icon: 'text-orange-300'
  }
}

const defaultIcons = {
  info: Info,
  success: CheckCircle,
  warning: AlertCircle
}

export function InfoBox({
  variant = 'info',
  icon,
  title,
  children,
  className,
  ...props
}: InfoBoxProps) {
  const styles = variantStyles[variant]
  const IconComponent = defaultIcons[variant]

  return (
    <div
      className={cn(
        'border rounded-lg p-4',
        styles.container,
        className
      )}
      {...props}
    >
      <div className="flex gap-3">
        {(icon !== null) && (
          <div className={cn('shrink-0', styles.icon)}>
            {icon || <IconComponent className="w-5 h-5" />}
          </div>
        )}
        <div className="flex-1 space-y-1">
          {title && (
            <div className={cn('font-semibold text-sm', styles.title)}>
              {title}
            </div>
          )}
          <div className={cn('text-xs leading-relaxed', styles.text)}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
