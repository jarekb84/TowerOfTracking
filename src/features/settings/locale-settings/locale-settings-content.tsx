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
 * A single row in the locale preview definition list.
 * Displays a label and formatted value with consistent styling.
 */
function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}:</dt>
      <dd className="font-mono text-foreground">{value}</dd>
    </div>
  );
}

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
      {/* Left Column: Import/Export Format */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Download className="h-5 w-5 text-purple-400" />
            Import/Export Format
          </CardTitle>
          <CardDescription>
            Configure how the game formats your data. These settings help the
            app correctly parse your pasted battle history and format exported
            CSV files.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Decimal Separator */}
          <div className="space-y-3">
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-foreground">
                Decimal Separator
              </h3>
              <p className="text-xs text-muted-foreground">
                How decimals appear in your game data and exported files (e.g.,
                43.91T vs 43,91T).
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

          <div className="border-t border-muted" />

          {/* Thousands Separator */}
          <div className="space-y-3">
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-foreground">
                Thousands Separator
              </h3>
              <p className="text-xs text-muted-foreground">
                How large numbers are grouped in your game data and exported
                files.
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

          <div className="border-t border-muted" />

          {/* Date Format */}
          <div className="space-y-3">
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-foreground">Date Format</h3>
              <p className="text-xs text-muted-foreground">
                How dates appear in your game data.
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
              <h3 className="text-sm font-medium text-foreground">Locale</h3>
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

          <div className="border-t border-muted" />

          {/* Preview */}
          <div className="space-y-3">
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-foreground">Preview</h3>
              <p className="text-xs text-muted-foreground">
                See how values will be displayed with your selected locale.
              </p>
            </div>
            <div className="rounded-lg bg-muted/30 border border-muted p-4 transition-all duration-200 hover:bg-muted/40 hover:border-primary/20">
              <dl className="space-y-2 text-sm">
                <PreviewRow label="Number" value={preview.number} />
                <PreviewRow label="Large Number" value={preview.largeNumber} />
                <PreviewRow label="Percentage" value={preview.percentage} />
                <PreviewRow label="Date" value={preview.date} />
                <PreviewRow label="Numeric Date" value={preview.numericDate} />
                <PreviewRow label="Short Date" value={preview.shortDate} />
                <PreviewRow label="Month Format" value={preview.monthDay} />
                <PreviewRow label="Time" value={preview.time} />
                <PreviewRow label="Date & Time" value={preview.dateTime} />
              </dl>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
