import { useState, useEffect } from 'react';
import { Button, Textarea, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from '../../../components/ui';
import { Download, Copy, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { exportToCsv, generateExportFilename, copyToClipboard, downloadAsFile } from '../utils/csv-exporter';
import type { CsvDelimiter } from '../types/game-run.types';
import type { CsvExportConfig, CsvExportResult, DelimiterConflict } from '../utils/csv-exporter';
import { getDelimiterString } from '../utils/csv-parser';
import { useData } from '../hooks/use-data';

interface CsvExportProps {
  className?: string;
}

export function CsvExport({ className }: CsvExportProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDelimiter, setSelectedDelimiter] = useState<CsvDelimiter>('tab');
  const [customDelimiter, setCustomDelimiter] = useState('');
  const [includeAppFields, setIncludeAppFields] = useState(true);
  const [exportResult, setExportResult] = useState<CsvExportResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { runs } = useData();

  // Generate export on settings change
  const generateExport = (): void => {
    if (runs.length === 0) return;
    
    setIsGenerating(true);
    setError(null);
    setCopySuccess(false);
    setDownloadSuccess(false);
    
    try {
      const config: CsvExportConfig = {
        delimiter: selectedDelimiter,
        customDelimiter: selectedDelimiter === 'custom' ? customDelimiter : undefined,
        includeAppFields
      };
      
      const result = exportToCsv(runs, config);
      setExportResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate export');
      setExportResult(null);
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-regenerate export when settings change
  useEffect(() => {
    if (isDialogOpen && runs.length > 0) {
      generateExport();
    }
  }, [selectedDelimiter, customDelimiter, includeAppFields, isDialogOpen]);

  const handleDelimiterChange = (delimiter: CsvDelimiter): void => {
    setSelectedDelimiter(delimiter);
  };

  const handleCustomDelimiterChange = (value: string): void => {
    setCustomDelimiter(value);
  };

  const handleIncludeAppFieldsChange = (checked: boolean): void => {
    setIncludeAppFields(checked);
  };

  const handleCopyToClipboard = async (): Promise<void> => {
    if (!exportResult?.csvContent) return;
    
    try {
      await copyToClipboard(exportResult.csvContent);
      setCopySuccess(true);
      setError(null);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to copy to clipboard');
      setCopySuccess(false);
    }
  };

  const handleDownloadFile = (): void => {
    if (!exportResult?.csvContent) return;
    
    try {
      const filename = generateExportFilename(exportResult.rowCount);
      downloadAsFile(exportResult.csvContent, filename);
      setDownloadSuccess(true);
      setError(null);
      setTimeout(() => setDownloadSuccess(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download file');
      setDownloadSuccess(false);
    }
  };

  const handleDialogOpenChange = (open: boolean): void => {
    setIsDialogOpen(open);
    if (!open) {
      // Reset state when dialog closes
      setExportResult(null);
      setError(null);
      setCopySuccess(false);
      setDownloadSuccess(false);
    }
  };

  const getDelimiterDisplayString = (): string => {
    if (selectedDelimiter === 'custom') {
      return customDelimiter || ',';
    }
    return getDelimiterString(selectedDelimiter);
  };

  return (
    <div className={className}>
      <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            className="gap-2"
            disabled={runs.length === 0}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-7xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Export CSV Data</DialogTitle>
            <DialogDescription>
              Export your game run data to CSV format using original field names for easy re-import.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Export Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Delimiter:</span>
                      <select 
                        value={selectedDelimiter} 
                        onChange={(e) => handleDelimiterChange(e.target.value as CsvDelimiter)}
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
                          onChange={(e) => handleCustomDelimiterChange(e.target.value)}
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
                        onChange={(e) => handleIncludeAppFieldsChange(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <label htmlFor="includeAppFields" className="text-sm text-muted-foreground">
                        Include Date/Time columns
                      </label>
                    </div>
                  </div>
                  
                  {exportResult && (
                    <div className="flex flex-wrap gap-4 text-sm bg-blue-50 border border-blue-200 p-3 rounded">
                      <span className="text-gray-900"><strong className="text-blue-800">Rows:</strong> {exportResult.rowCount}</span>
                      <span className="text-gray-900"><strong className="text-blue-800">Columns:</strong> {exportResult.fieldCount}</span>
                      <span className="text-gray-900"><strong className="text-blue-800">Delimiter:</strong> "{getDelimiterDisplayString()}"</span>
                    </div>
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
                          Examples: {conflict.conflictingValues.slice(0, 2).map(v => `"${v}"`).join(', ')}
                          {conflict.conflictingValues.length > 2 && '...'}
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
                        className={`gap-2 ${copySuccess ? 'bg-green-600 hover:bg-green-700' : ''}`}
                      >
                        {copySuccess ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                        {copySuccess ? 'Copied!' : 'Copy to Clipboard'}
                      </Button>
                      
                      <Button
                        onClick={handleDownloadFile}
                        disabled={isGenerating}
                        variant="outline"
                        className={`gap-2 ${downloadSuccess ? 'border-green-600 text-green-600' : ''}`}
                      >
                        {downloadSuccess ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        {downloadSuccess ? 'Downloaded!' : 'Download File'}
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

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}