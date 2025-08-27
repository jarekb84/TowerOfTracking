import { Input, Textarea } from '../../../components/ui';
import { AlertTriangle, XCircle } from 'lucide-react';
import type { CsvDelimiter } from '../types/game-run.types';
import type { DelimiterConflict, CsvExportResult } from '../utils/csv-exporter';
import { formatConflictExamples, getExportStatsDisplay } from '../utils/csv-export-helpers';

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

interface ConflictWarningsProps {
  conflicts: DelimiterConflict[];
}

export function ConflictWarnings({ conflicts }: ConflictWarningsProps) {
  if (conflicts.length === 0) return null;
  
  return (
    <div className="bg-orange-50 border border-orange-200 rounded p-4">
      <div className="flex items-start gap-2 mb-3">
        <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="font-medium text-orange-900 mb-1">
            Delimiter Conflicts Detected
          </h4>
          <p className="text-sm text-orange-800">
            The selected delimiter appears in {conflicts.length} field{conflicts.length !== 1 ? 's' : ''}. 
            These values have been automatically escaped with quotes in the export.
          </p>
        </div>
      </div>
      <div className="space-y-2">
        {conflicts.map((conflict, index) => (
          <div key={index} className="pl-7 border-l-2 border-orange-300 ml-2.5">
            <div className="font-medium text-sm text-orange-900">
              {conflict.originalKey} ({conflict.affectedRunCount} runs affected)
            </div>
            <div className="text-sm text-orange-700">
              Examples: {formatConflictExamples(conflict.conflictingValues)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ExportPreviewProps {
  csvContent: string;
  isGenerating: boolean;
}

export function ExportPreview({ csvContent, isGenerating }: ExportPreviewProps) {
  return (
    <Textarea
      value={csvContent}
      readOnly
      className="h-64 font-mono text-xs bg-gray-50"
      placeholder={isGenerating ? "Generating CSV..." : "CSV preview will appear here"}
    />
  );
}

interface ErrorDisplayProps {
  error: string;
}

export function ErrorDisplay({ error }: ErrorDisplayProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded p-4 flex items-start gap-2">
      <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <h4 className="font-medium text-red-900 mb-1">Export Error</h4>
        <p className="text-sm text-red-800">{error}</p>
      </div>
    </div>
  );
}