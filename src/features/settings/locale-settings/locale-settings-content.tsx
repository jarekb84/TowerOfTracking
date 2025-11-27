import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import { Select } from '@/components/ui/select';
import { SelectionButtonGroup } from '@/components/ui/selection-button-group';
import { Download, Globe } from 'lucide-react';
import { useLocaleSettings } from './use-locale-settings';

/**
 * Content component for the /settings/locale route.
 * Two-column layout separating import format (parsing) from display locale (rendering).
 */
export function LocaleSettingsContent() {
  const {
    importFormat,
    displayLocale,
    decimalSeparatorOptions,
    thousandsSeparatorOptions,
    dateFormatOptions,
    displayLocaleOptions,
    preview,
    onDecimalSeparatorChange,
    onThousandsSeparatorChange,
    onDateFormatChange,
    onDisplayLocaleChange,
  } = useLocaleSettings();

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Left Column: Import Format */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Download className="h-5 w-5 text-purple-400" />
            Import Format
          </CardTitle>
          <CardDescription>
            Configure how the game exports your data. These settings help the
            app correctly parse your pasted battle history.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Decimal Separator */}
          <div className="space-y-3">
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-slate-200">
                Decimal Separator
              </h3>
              <p className="text-xs text-muted-foreground">
                How decimals appear in your game exports (e.g., 43.91T vs
                43,91T).
              </p>
            </div>
            <SelectionButtonGroup
              options={decimalSeparatorOptions}
              selectedValue={importFormat.decimalSeparator}
              onSelectionChange={onDecimalSeparatorChange}
              ariaLabel="Decimal separator selection"
              accentColor="purple"
              spacing="normal"
            />
          </div>

          <div className="border-t border-slate-700/50" />

          {/* Thousands Separator */}
          <div className="space-y-3">
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-slate-200">
                Thousands Separator
              </h3>
              <p className="text-xs text-muted-foreground">
                How large numbers are grouped in your game exports.
              </p>
            </div>
            <SelectionButtonGroup
              options={thousandsSeparatorOptions}
              selectedValue={importFormat.thousandsSeparator}
              onSelectionChange={onThousandsSeparatorChange}
              ariaLabel="Thousands separator selection"
              accentColor="purple"
              spacing="normal"
            />
          </div>

          <div className="border-t border-slate-700/50" />

          {/* Date Format */}
          <div className="space-y-3">
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-slate-200">Date Format</h3>
              <p className="text-xs text-muted-foreground">
                How dates appear in your game exports.
              </p>
            </div>
            <SelectionButtonGroup
              options={dateFormatOptions}
              selectedValue={importFormat.dateFormat}
              onSelectionChange={onDateFormatChange}
              ariaLabel="Date format selection"
              accentColor="purple"
              spacing="normal"
            />
          </div>
        </CardContent>
      </Card>

      {/* Right Column: Display Locale */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="h-5 w-5 text-purple-400" />
            Display Format
          </CardTitle>
          <CardDescription>
            Choose how numbers and dates are displayed throughout the app.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Locale Dropdown */}
          <div className="space-y-3">
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-slate-200">Locale</h3>
              <p className="text-xs text-muted-foreground">
                Select your preferred display format.
              </p>
            </div>
            <Select
              value={displayLocale}
              onChange={(e) => onDisplayLocaleChange(e.target.value)}
              width="full"
              aria-label="Display locale selection"
            >
              {displayLocaleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="border-t border-slate-700/50" />

          {/* Preview */}
          <div className="space-y-3">
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-slate-200">Preview</h3>
              <p className="text-xs text-muted-foreground">
                See how values will be displayed with your selected locale.
              </p>
            </div>
            <div className="rounded-md border border-slate-700 bg-slate-800/50 p-4">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-400">Number:</dt>
                  <dd className="font-mono text-slate-200">{preview.number}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-400">Large Number:</dt>
                  <dd className="font-mono text-slate-200">
                    {preview.largeNumber}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-400">Percentage:</dt>
                  <dd className="font-mono text-slate-200">
                    {preview.percentage}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-400">Date:</dt>
                  <dd className="font-mono text-slate-200">{preview.date}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-400">Date & Time:</dt>
                  <dd className="font-mono text-slate-200">
                    {preview.dateTime}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
