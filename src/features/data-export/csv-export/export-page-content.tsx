import { Card, CardContent, CardDescription, CardHeader, CardTitle, EmptyState } from '@/components/ui';
import { FileWarning } from 'lucide-react';
import { useData } from '@/shared/domain/use-data';
import { useCsvExport } from './use-csv-export';
import { ExportControls, ExportStats } from './csv-export-dialog-sections';
import { ConflictsCard, CsvPreviewCard, ExportErrorAlert, ExportLoadingAlert } from './export-page-sections';

/**
 * Full-page export content component for the /settings/export route.
 * Displays the export workflow without modal wrapper.
 */
export function ExportPageContent() {
  const { runs } = useData();

  // Pass true for isDialogOpen to trigger auto-generation on mount
  const {
    selectedDelimiter,
    customDelimiter,
    includeAppFields,
    exportResult,
    isGenerating,
    copySuccess,
    downloadSuccess,
    error,
    setSelectedDelimiter,
    setCustomDelimiter,
    setIncludeAppFields,
    handleCopyToClipboard,
    handleDownloadFile,
  } = useCsvExport(runs, true);

  // Empty state - no runs to export
  if (runs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Export Game Runs</CardTitle>
          <CardDescription>
            Export your game run data to CSV format.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<FileWarning className="h-8 w-8" />}
            className="py-8"
          >
            <span className="block font-medium text-slate-300 mb-1">No Data to Export</span>
            Import some game runs first before exporting.
          </EmptyState>
        </CardContent>
      </Card>
    );
  }

  const hasConflicts = exportResult?.conflicts && exportResult.conflicts.length > 0;
  const hasCsvContent = exportResult?.csvContent;

  return (
    <div className="space-y-4">
      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Export Configuration</CardTitle>
          <CardDescription>
            Export your game run data to CSV format using original field names for easy re-import.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <ExportControls
              selectedDelimiter={selectedDelimiter}
              customDelimiter={customDelimiter}
              includeAppFields={includeAppFields}
              onDelimiterChange={setSelectedDelimiter}
              onCustomDelimiterChange={setCustomDelimiter}
              onIncludeAppFieldsChange={setIncludeAppFields}
            />

            {exportResult && (
              <ExportStats
                exportResult={exportResult}
                selectedDelimiter={selectedDelimiter}
                customDelimiter={customDelimiter}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delimiter Conflicts Warning */}
      {hasConflicts && <ConflictsCard conflicts={exportResult.conflicts} />}

      {/* CSV Preview */}
      {hasCsvContent && (
        <CsvPreviewCard
          csvContent={exportResult.csvContent}
          isGenerating={isGenerating}
          copySuccess={copySuccess}
          downloadSuccess={downloadSuccess}
          onCopy={handleCopyToClipboard}
          onDownload={handleDownloadFile}
        />
      )}

      {/* Error Display */}
      {error && <ExportErrorAlert error={error} />}

      {/* Loading State */}
      {isGenerating && <ExportLoadingAlert />}
    </div>
  );
}
