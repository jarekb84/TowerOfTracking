import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui';
import { CheckCircle, AlertCircle } from 'lucide-react';
import type { CsvParseResult } from '../../../data-tracking/types/game-run.types';
import { FieldMappingTable } from './field-mapping-table';

interface FieldMappingReportProps {
  parseResult: CsvParseResult;
}

export function FieldMappingReport({ parseResult }: FieldMappingReportProps) {
  const { fieldMappingReport } = parseResult;

  if (!fieldMappingReport || fieldMappingReport.mappedFields.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Field Mapping</CardTitle>
        <CardDescription>
          How your CSV column headers map to supported fields
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-800">
                {fieldMappingReport.mappedFields.filter(f => f.supported).length} Supported Fields
              </span>
            </div>
            <div className="flex items-center gap-2 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <span className="font-medium text-orange-800">
                {fieldMappingReport.unsupportedFields.length} Unsupported Fields
              </span>
            </div>
            <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-800">
                {parseResult.success.length} Runs Ready
              </span>
            </div>
          </div>

          <FieldMappingTable mappedFields={fieldMappingReport.mappedFields} />

          {/* New Fields Info */}
          {fieldMappingReport.newFields && fieldMappingReport.newFields.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-sm font-medium text-blue-800 mb-1">
                {fieldMappingReport.newFields.length} new {fieldMappingReport.newFields.length === 1 ? 'field' : 'fields'} will be added:
              </p>
              <p className="text-xs text-blue-700">
                {fieldMappingReport.newFields.join(', ')}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                These fields will be imported as new columns in your data.
              </p>
            </div>
          )}

          {/* Unsupported Fields Info */}
          {fieldMappingReport.unsupportedFields && fieldMappingReport.unsupportedFields.length > 0 && (
            <div className="bg-slate-50 border border-slate-300 rounded p-3">
              <p className="text-sm font-medium text-slate-800 mb-1">
                {fieldMappingReport.unsupportedFields.length} {fieldMappingReport.unsupportedFields.length === 1 ? 'field is' : 'fields are'} not in our static list (but will still be imported):
              </p>
              <p className="text-xs text-slate-700 mb-2">
                {fieldMappingReport.unsupportedFields.slice(0, 10).join(', ')}
                {fieldMappingReport.unsupportedFields.length > 10 && ` ... and ${fieldMappingReport.unsupportedFields.length - 10} more`}
              </p>
              <p className="text-xs text-slate-600">
                These fields will be imported normally. &quot;Unsupported&quot; just means they&apos;re not in our pre-configured list - this is fine for new game fields or custom data.
              </p>
            </div>
          )}

          {/* Similar Fields Warning */}
          {fieldMappingReport.similarFields && fieldMappingReport.similarFields.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-300 rounded p-3">
              <p className="text-sm font-medium text-yellow-900 mb-2">
                ⚠️ Similar fields detected - possible duplicates:
              </p>
              <div className="space-y-1">
                {fieldMappingReport.similarFields.map((similar, index) => (
                  <div key={index} className="text-xs text-yellow-800 flex items-center gap-1">
                    <span className="font-mono font-medium">&apos;{similar.importedField}&apos;</span>
                    <span>looks like</span>
                    <span className="font-mono font-medium">&apos;{similar.existingField}&apos;</span>
                    <span className="text-yellow-600">({similar.similarityType})</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-yellow-700 mt-2">
                These will be imported as NEW columns unless you rename them to match existing fields.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
