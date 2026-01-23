/**
 * Currency Input Field Component
 *
 * Reusable input field with optional scale selector for currency values.
 * Used within a labeled grid layout - does not render its own label.
 */

/* eslint-disable complexity */
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { formatLargeNumber, parseShorthandNumber } from '@/shared/formatting/number-scale'
import { SCALE_OPTIONS } from './scale-options'



interface CurrencyInputFieldProps {
  value: number
  scale: string
  hasUnitSelector: boolean
  onChange: (value: number) => void
  onScaleChange: (scale: string) => void
  readOnly?: boolean
  disabled?: boolean
}

export function CurrencyInputField({
  value,
  scale,
  hasUnitSelector,
  onChange,
  onScaleChange,
  readOnly = false,
  disabled = false,
}: CurrencyInputFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value
    if (hasUnitSelector && scale) {
      const multiplier = SCALE_OPTIONS.find((s) => s.value === scale)?.multiplier || 1
      const numValue = parseFloat(rawValue) || 0
      onChange(numValue * multiplier)
    } else {
      const parsed = parseShorthandNumber(rawValue)
      onChange(parsed)
    }
  }

  const handleScaleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onScaleChange(e.target.value)
  }

  const displayValue = hasUnitSelector && scale
    ? (value / (SCALE_OPTIONS.find((s) => s.value === scale)?.multiplier || 1)).toString()
    : formatLargeNumber(value)

  if (readOnly) {
    return (
      <span className="h-8 flex items-center justify-end text-sm text-slate-300 bg-slate-800/30 rounded px-3 border border-slate-600/50 min-w-[6rem]">
        {value || 0}
      </span>
    )
  }

  // Disabled shows the value with a subtle visual distinction (auto-calculated)
  if (disabled) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-24 h-8 flex items-center justify-end text-sm text-blue-300 bg-blue-500/5 rounded px-3 border border-blue-500/20">
          {displayValue === '0' ? '0' : displayValue}
        </div>
        {hasUnitSelector && (
          <span className="text-xs text-slate-500 w-16">
            {SCALE_OPTIONS.find((s) => s.value === scale)?.label || scale}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        type="text"
        value={displayValue === '0' ? '' : displayValue}
        onChange={handleChange}
        className="w-24 h-8 text-right text-sm bg-slate-800/50"
        placeholder="0"
      />
      {hasUnitSelector && (
        <Select
          value={scale}
          onChange={handleScaleChange}
          size="compact"
          width="sm"
          className="w-16"
        >
          {SCALE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      )}
    </div>
  )
}
