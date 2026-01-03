/**
 * Add Event Form Component
 *
 * Form fields for adding a new spending event.
 */

import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { FormControl } from '@/components/ui/form-field'
import { SCALE_DEFINITIONS } from '@/shared/formatting/number-scale'
import type { CurrencyId, CurrencyConfig } from '../types'

/**
 * Scale options for the amount selector.
 * Derived from the shared SCALE_DEFINITIONS with an empty option for "no scale".
 */
export const SCALE_OPTIONS = [
  { value: '', label: '--', multiplier: 1 },
  ...SCALE_DEFINITIONS.map(({ suffix, multiplier }) => ({
    value: suffix,
    label: suffix,
    multiplier,
  })),
] as const

interface AddEventFormProps {
  name: string
  currencyId: CurrencyId
  amountValue: string
  amountScale: string
  durationDays: string
  currencies: CurrencyConfig[]
  selectedCurrency: CurrencyConfig
  onNameChange: (value: string) => void
  onCurrencyChange: (value: CurrencyId) => void
  onAmountValueChange: (value: string) => void
  onAmountScaleChange: (value: string) => void
  onDurationChange: (value: string) => void
}

export function AddEventForm({
  name,
  currencyId,
  amountValue,
  amountScale,
  durationDays,
  currencies,
  selectedCurrency,
  onNameChange,
  onCurrencyChange,
  onAmountValueChange,
  onAmountScaleChange,
  onDurationChange,
}: AddEventFormProps) {
  return (
    <div className="space-y-4">
      <FormControl label="Name" required layout="vertical">
        <Input
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="e.g., Unlock Damage Mastery"
        />
      </FormControl>

      <FormControl label="Currency" required layout="vertical">
        <Select
          value={currencyId}
          onChange={(e) => onCurrencyChange(e.target.value as CurrencyId)}
          width="full"
        >
          {currencies.map((currency) => (
            <option key={currency.id} value={currency.id}>
              {currency.displayName}
            </option>
          ))}
        </Select>
      </FormControl>

      <FormControl label="Amount" required layout="vertical">
        <div className="flex gap-2">
          <Input
            type="number"
            value={amountValue}
            onChange={(e) => onAmountValueChange(e.target.value)}
            placeholder="0"
            min={0}
            className="flex-1"
          />
          {selectedCurrency.hasUnitSelector && (
            <Select
              value={amountScale}
              onChange={(e) => onAmountScaleChange(e.target.value)}
              width="sm"
            >
              {SCALE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          )}
        </div>
      </FormControl>

      <FormControl label="Duration (days)" layout="vertical">
        <Input
          type="number"
          value={durationDays}
          onChange={(e) => onDurationChange(e.target.value)}
          placeholder="Optional - for labs"
          min={0}
          className="w-32"
        />
      </FormControl>
    </div>
  )
}
