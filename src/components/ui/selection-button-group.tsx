import { Button } from "./button"
import { cn } from "../../shared/lib/utils"

export interface SelectionOption<T = string> {
  value: T
  label: string
  color?: string
  icon?: React.ReactNode
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
  equalWidth = false
}: SelectionButtonGroupProps<T>) {
  const spacingClasses = {
    tight: 'gap-1',
    normal: 'gap-2',
    loose: 'gap-3'
  };
  return (
    <div className={cn(
      "flex",
      spacingClasses[spacing],
      vertical ? "flex-col" : "flex-wrap",
      equalWidth && "w-full",
      className
    )}>
      {options.map((option) => (
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
            backgroundColor: `${option.color}20`,
            borderColor: `${option.color}70`,
            color: '#f1f5f9'
          } : undefined}
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
      ))}
    </div>
  )
}