import { Input } from '@/components/ui';
import type { CsvDelimiter } from '@/features/data-import/csv-import/types';
import type { CsvExportResult } from './csv-exporter';
import { getExportStatsDisplay } from './csv-export-helpers';

interface ExportControlsProps {
  selectedDelimiter: CsvDelimiter;
  customDelimiter: string;
  includeAppFields: boolean;
  onDelimiterChange: (delimiter: CsvDelimiter) => void;
  onCustomDelimiterChange: (delimiter: string) => void;
  onIncludeAppFieldsChange: (include: boolean) => void;
}

export function ExportControls({
  selectedDelimiter,
  customDelimiter,
  includeAppFields,
  onDelimiterChange,
  onCustomDelimiterChange,
  onIncludeAppFieldsChange
}: ExportControlsProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Delimiter:</span>
        <select 
          value={selectedDelimiter} 
          onChange={(e) => onDelimiterChange(e.target.value as CsvDelimiter)}
          className="w-32 px-2 py-1 border rounded text-sm bg-background"
        >
          <option value="tab">Tab</option>
          <option value="comma">Comma</option>
          <option value="semicolon">Semicolon</option>
          <option value="custom">Custom</option>
        </select>
        {selectedDelimiter === 'custom' && (
          <Input
            placeholder="Enter delimiter"
            value={customDelimiter}
            onChange={(e) => onCustomDelimiterChange(e.target.value)}
            className="w-20"
            maxLength={1}
          />
        )}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="includeAppFields"
          checked={includeAppFields}
          onChange={(e) => onIncludeAppFieldsChange(e.target.checked)}
          className="w-4 h-4"
        />
        <label htmlFor="includeAppFields" className="text-sm text-muted-foreground">
          Include Date/Time columns
        </label>
      </div>
    </div>
  );
}

interface ExportStatsProps {
  exportResult: CsvExportResult;
  selectedDelimiter: CsvDelimiter;
  customDelimiter: string;
}

export function ExportStats({ exportResult, selectedDelimiter, customDelimiter }: ExportStatsProps) {
  const stats = getExportStatsDisplay(exportResult, selectedDelimiter, customDelimiter);
  
  return (
    <div className="flex flex-wrap gap-4 text-sm bg-blue-50 border border-blue-200 p-3 rounded">
      {stats.map((stat, index) => (
        <span key={index} className="text-gray-900">
          <strong className="text-blue-800">{stat.label}:</strong> {stat.value}
        </span>
      ))}
    </div>
  );
}