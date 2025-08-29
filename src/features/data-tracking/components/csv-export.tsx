import { useState } from 'react';
import { Button, Textarea, DialogTrigger, Card, CardContent, CardDescription, CardHeader, CardTitle, ResponsiveDialog, ResponsiveDialogContent, ResponsiveDialogHeader, ResponsiveDialogBody, ResponsiveDialogFooter } from '../../../components/ui';
import { Download, Copy, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import type { DelimiterConflict } from '../utils/csv-exporter';
import { useData } from '../hooks/use-data';
import { useCsvExport } from '../hooks/use-csv-export';
import { 
  getCopyButtonClassName, 
  getDownloadButtonClassName,
  isExportDisabled,
  formatConflictExamples,
  getCopyButtonText,
  getDownloadButtonText
} from '../utils/csv-export-helpers';
import {
  ExportControls,
  ExportStats,
} from './csv-export-dialog-sections';

interface CsvExportProps {
  className?: string;
}

export function CsvExport({ className }: CsvExportProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { runs } = useData();
  
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
    resetState
  } = useCsvExport(runs, isDialogOpen);

  const handleDialogOpenChange = (open: boolean): void => {
    setIsDialogOpen(open);
    if (!open) {
      resetState();
    }
  };

  return (
    <div className={className}>
      <ResponsiveDialog 
        open={isDialogOpen} 
        onOpenChange={handleDialogOpenChange}
        trigger={
          <DialogTrigger asChild>
            <Button 
            variant="outline" 
            className="gap-2"
            disabled={isExportDisabled(runs.length)}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          </DialogTrigger>
        }
      >
        <ResponsiveDialogContent className="sm:max-w-7xl">
          <ResponsiveDialogHeader
            title="Export CSV Data"
            description="Export your game run data to CSV format using original field names for easy re-import."
          />
          
          <ResponsiveDialogBody>
            <div className="space-y-4">
            {/* Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Export Configuration</CardTitle>
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
            {exportResult?.conflicts && exportResult.conflicts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-orange-700">
                    <AlertTriangle className="h-5 w-5" />
                    Delimiter Conflicts Detected
                  </CardTitle>
                  <CardDescription>
                    Some field values contain the selected delimiter. These will be automatically quoted in the CSV.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {exportResult.conflicts.map((conflict: DelimiterConflict, index: number) => (
                      <div key={index} className="bg-orange-50 border border-orange-200 rounded p-3">
                        <div className="font-medium text-orange-800 mb-1">
                          {conflict.originalKey} ({conflict.affectedRunCount} runs affected)
                        </div>
                        <div className="text-sm text-orange-700">
                          Examples: {formatConflictExamples(conflict.conflictingValues)}
                        </div>
                      </div>
                    ))}
                    <div className="text-sm text-orange-700 bg-orange-50 border border-orange-200 rounded p-2">
                      💡 Consider using a different delimiter (Tab or Semicolon) to avoid quoting.
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* CSV Preview */}
            {exportResult?.csvContent && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">CSV Preview</CardTitle>
                  <CardDescription>
                    Preview of the CSV data that will be exported
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Textarea
                      value={exportResult.csvContent}
                      readOnly
                      className="font-mono text-sm h-48 resize-none bg-white border-gray-300 text-gray-900"
                      placeholder="Generated CSV content will appear here..."
                    />
                    
                    <div className="flex gap-3">
                      <Button
                        onClick={handleCopyToClipboard}
                        disabled={isGenerating}
                        className={getCopyButtonClassName(copySuccess)}
                      >
                        {copySuccess ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                        {getCopyButtonText(copySuccess)}
                      </Button>
                      
                      <Button
                        onClick={handleDownloadFile}
                        disabled={isGenerating}
                        variant="outline"
                        className={getDownloadButtonClassName(downloadSuccess)}
                      >
                        {downloadSuccess ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        {getDownloadButtonText(downloadSuccess)}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Error Display */}
            {error && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircle className="h-4 w-4" />
                    <span className="text-sm">{error}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Loading State */}
            {isGenerating && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-blue-600">
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    <span className="text-sm">Generating CSV export...</span>
                  </div>
                </CardContent>
              </Card>
            )}
            </div>
          </ResponsiveDialogBody>

          <ResponsiveDialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              className="h-11"
            >
              Close
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  );
}