import { Button } from "./button"
import { cn } from "../../shared/lib/utils"
import { TooltipContentWrapper } from "./tooltip-content"
import * as Tooltip from '@radix-ui/react-tooltip'

export interface SelectionOption<T = string> {
  value: T
  label: string
  color?: string
  icon?: React.ReactNode
  tooltip?: string
  /** Optional badge/count to display with subtle styling */
  badge?: string | number
}

type AccentColor = 'orange' | 'purple' | 'cyan'

interface SelectionButtonGroupProps<T = string> {
  options: SelectionOption<T>[]
  selectedValue: T
  onSelectionChange: (value: T) => void
  className?: string
  buttonClassName?: string
  size?: "sm" | "default" | "lg"
  fullWidthOnMobile?: boolean
  vertical?: boolean
  spacing?: 'tight' | 'normal' | 'loose'
  equalWidth?: boolean
  ariaLabel?: string
  /** Accent color theme for selected state. Defaults to 'orange'. */
  accentColor?: AccentColor
}

const accentColorClasses: Record<AccentColor, string> = {
  orange: 'border-orange-500/70 bg-orange-500/10 hover:bg-orange-500/20 hover:border-orange-500/80 hover:shadow-orange-500/20',
  purple: 'border-purple-500/70 bg-purple-500/10 hover:bg-purple-500/20 hover:border-purple-500/80 hover:shadow-purple-500/20',
  cyan: 'border-cyan-500/70 bg-cyan-500/10 hover:bg-cyan-500/20 hover:border-cyan-500/80 hover:shadow-cyan-500/20'
}

export function SelectionButtonGroup<T = string>({
  options,
  selectedValue,
  onSelectionChange,
  className,
  buttonClassName,
  size = "sm",
  fullWidthOnMobile = true,
  vertical = false,
  spacing = 'tight',
  equalWidth = false,
  ariaLabel,
  accentColor = 'orange'
}: SelectionButtonGroupProps<T>) {
  const spacingClasses = {
    tight: 'gap-1',
    normal: 'gap-2',
    loose: 'gap-3'
  };
  return (
    <Tooltip.Provider delayDuration={400}>
      <div
        className={cn(
          "flex",
          spacingClasses[spacing],
          vertical ? "flex-col" : "flex-wrap",
          equalWidth && "w-full",
          className
        )}
        role="group"
        aria-label={ariaLabel}
      >
        {options.map((option) => {
          const isSelected = selectedValue === option.value
          const hasOptionColor = Boolean(option.color)

          const button = (
            <Button
              key={String(option.value)}
              variant="outline"
              size={size}
              selected={false} // We handle selection styling ourselves for accent color support
              aria-pressed={isSelected} // Override aria-pressed for accessibility (selected={false} would set this to false)
              onClick={() => onSelectionChange(option.value)}
              fullWidthOnMobile={fullWidthOnMobile}
              className={cn(
                "whitespace-nowrap shrink-0",
                equalWidth && "flex-1 min-w-0",
                // Apply accent color classes for selected state when no option-specific color
                isSelected && !hasOptionColor && accentColorClasses[accentColor],
                isSelected && !hasOptionColor && "text-foreground shadow-xs hover:shadow-md",
                buttonClassName
              )}
              style={hasOptionColor && isSelected ? {
                backgroundColor: `${option.color}15`,
                borderColor: `${option.color}60`,
                color: 'var(--color-foreground)',
              } : undefined}
              onMouseEnter={(e) => {
                if (hasOptionColor && isSelected) {
                  e.currentTarget.style.backgroundColor = `${option.color}25`;
                  e.currentTarget.style.borderColor = `${option.color}70`;
                }
              }}
              onMouseLeave={(e) => {
                if (hasOptionColor && isSelected) {
                  e.currentTarget.style.backgroundColor = `${option.color}15`;
                  e.currentTarget.style.borderColor = `${option.color}60`;
                }
              }}
            >
              {option.color && option.icon && (
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: option.color }}
                />
              )}
              {option.icon && typeof option.icon !== 'boolean' && option.icon}
              {option.label}
              {option.badge !== undefined && (
                <span className="ml-1.5 text-[0.65rem] leading-none text-muted-foreground/60 font-normal tabular-nums opacity-80">
                  {option.badge}
                </span>
              )}
            </Button>
          )

          // Wrap with tooltip if provided
          if (option.tooltip) {
            return (
              <Tooltip.Root key={String(option.value)}>
                <Tooltip.Trigger asChild>
                  {button}
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    side="top"
                    sideOffset={8}
                    className="z-50"
                  >
                    <TooltipContentWrapper>
                      {option.tooltip}
                    </TooltipContentWrapper>
                    <Tooltip.Arrow className="fill-slate-950" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            )
          }

          return button
        })}
      </div>
    </Tooltip.Provider>
  )
}