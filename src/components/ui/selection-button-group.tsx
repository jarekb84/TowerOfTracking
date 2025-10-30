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
}

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
  ariaLabel
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
          const button = (
            <Button
              key={String(option.value)}
              variant="outline"
              size={size}
              selected={selectedValue === option.value}
              onClick={() => onSelectionChange(option.value)}
              fullWidthOnMobile={fullWidthOnMobile}
              className={cn(
                "whitespace-nowrap shrink-0",
                equalWidth && "flex-1 min-w-0",
                buttonClassName
              )}
              style={option.color && selectedValue === option.value ? {
                backgroundColor: `${option.color}15`,
                borderColor: `${option.color}60`,
                color: 'var(--color-foreground)',
              } : undefined}
              onMouseEnter={(e) => {
                if (option.color && selectedValue === option.value) {
                  e.currentTarget.style.backgroundColor = `${option.color}25`;
                  e.currentTarget.style.borderColor = `${option.color}70`;
                }
              }}
              onMouseLeave={(e) => {
                if (option.color && selectedValue === option.value) {
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