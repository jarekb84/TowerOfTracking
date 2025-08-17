import { useState } from 'react';
import { Button, Textarea, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from '../../../components/ui';
import { format } from 'date-fns';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { parseGenericCsv, getDelimiterString } from '../utils/csv-parser';
import { formatNumber, formatDuration } from '../utils/data-parser';
import { getFieldValue } from '../utils/field-utils';
import { useData } from '../hooks/use-data';
import type { CsvDelimiter, CsvParseResult } from '../types/game-run.types';

interface CsvImportProps {
  className?: string;
}

export function CsvImport({ className }: CsvImportProps) {
  const [inputData, setInputData] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [parseResult, setParseResult] = useState<CsvParseResult | null>(null);
  const [selectedDelimiter, setSelectedDelimiter] = useState<CsvDelimiter>('tab');
  const [customDelimiter, setCustomDelimiter] = useState('');
  const { addRun } = useData();

  const parseData = (text: string): void => {
    if (!text.trim()) {
      setParseResult(null);
      return;
    }

    try {
      const delimiter = selectedDelimiter === 'custom' ? customDelimiter : getDelimiterString(selectedDelimiter);
      const result = parseGenericCsv(text, { delimiter });
      setParseResult(result);
    } catch (error) {
      setParseResult({
        success: [],
        failed: 0,
        errors: ['Failed to parse data: ' + (error instanceof Error ? error.message : 'Unknown error')],
        fieldMappingReport: { mappedFields: [], unsupportedFields: [], skippedFields: [] }
      });
    }
  };

  const handlePaste = async (): Promise<void> => {
    try {
      const text = await navigator.clipboard.readText();
      setInputData(text);
      parseData(text);
    } catch (error) {
      console.error('Failed to read clipboard:', error);
    }
  };

  const handleInputChange = (value: string): void => {
    setInputData(value);
    parseData(value);
  };

  const handleDelimiterChange = (delimiter: CsvDelimiter): void => {
    setSelectedDelimiter(delimiter);
    if (inputData.trim()) {
      parseData(inputData);
    }
  };

  const handleCustomDelimiterChange = (value: string): void => {
    setCustomDelimiter(value);
    if (selectedDelimiter === 'custom' && inputData.trim()) {
      parseData(inputData);
    }
  };

  const handleImport = (): void => {
    if (parseResult?.success) {
      parseResult.success.forEach(run => {
        addRun(run);
      });
    }
    setInputData('');
    setParseResult(null);
    setSelectedDelimiter('tab');
    setCustomDelimiter('');
    setIsDialogOpen(false);
  };

  const handleCancel = (): void => {
    setInputData('');
    setParseResult(null);
    setSelectedDelimiter('tab');
    setCustomDelimiter('');
    setIsDialogOpen(false);
  };

  return (
    <div className={className}>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <FileText className="h-4 w-4" />
            Import CSV/TSV
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-7xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import CSV/Tab-Delimited Data</DialogTitle>
            <DialogDescription>
              Import game run data from any CSV format. Column headers will be automatically mapped to supported fields. Use any field names - they'll be converted to camelCase and validated against the 84 supported fields.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-3 items-center">
                <Button 
                  variant="outline" 
                  onClick={handlePaste}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Paste from Clipboard
                </Button>
                
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
              </div>
              
              <Textarea
                placeholder="Paste your CSV data here...
Example format (any column names work):
Date,Time,Tier,Wave,Real Time,Coins Earned,Cells Earned,Killed By,Notes
2024-01-15,14:30,10,5881,7h 46m 6s,1.13T,45.2K,Wall,Good run
2024-01-16,16:20,11,6200,8h 12m 30s,1.45T,52.1K,Elite,Another run

Column headers will be automatically converted to camelCase and matched against supported fields."
                value={inputData}
                onChange={(e) => handleInputChange(e.target.value)}
                className="font-mono text-sm h-48 resize-none"
              />
            </div>

            {/* Field Mapping Report */}
            {parseResult?.fieldMappingReport && parseResult.fieldMappingReport.mappedFields.length > 0 && (
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
                          {parseResult.fieldMappingReport.mappedFields.filter(f => f.supported).length} Supported Fields
                        </span>
                      </div>
                      <div className="flex items-center gap-2 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                        <span className="font-medium text-orange-800">
                          {parseResult.fieldMappingReport.unsupportedFields.length} Unsupported Fields
                        </span>
                      </div>
                      <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-800">
                          {parseResult.success.length} Runs Ready
                        </span>
                      </div>
                    </div>

                    {/* Field mapping table */}
                    <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg shadow-sm">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100 border-b border-gray-300 sticky top-0">
                          <tr>
                            <th className="text-left p-3 font-semibold text-gray-900">CSV Header</th>
                            <th className="text-left p-3 font-semibold text-gray-900">Mapped Field</th>
                            <th className="text-center p-3 font-semibold text-gray-900">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parseResult.fieldMappingReport.mappedFields.map((field, index) => (
                            <tr key={index} className={`border-t border-gray-200 hover:bg-gray-50 transition-colors ${
                              field.supported 
                                ? 'bg-green-50 hover:bg-green-100' 
                                : 'bg-orange-50 hover:bg-orange-100'
                            }`}>
                              <td className="p-3 font-mono text-gray-900 font-medium">{field.csvHeader}</td>
                              <td className="p-3 font-mono text-gray-700">{field.camelCase}</td>
                              <td className="p-3 text-center">
                                {field.supported ? (
                                  <div className="flex items-center justify-center">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center">
                                    <XCircle className="h-4 w-4 text-orange-600" />
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Unsupported fields warning */}
                    {parseResult.fieldMappingReport.unsupportedFields.length > 0 && (
                      <div className="bg-orange-50 border border-orange-200 rounded p-3">
                        <p className="text-sm font-medium text-orange-800 mb-1">
                          Unsupported fields will be skipped:
                        </p>
                        <p className="text-xs text-orange-700">
                          {parseResult.fieldMappingReport.unsupportedFields.join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Import Status */}
            {parseResult && (parseResult.success.length > 0 || parseResult.failed > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Import Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex gap-4 text-sm">
                      <span className="text-green-600">✓ {parseResult.success.length} runs will be imported</span>
                      {parseResult.failed > 0 && (
                        <span className="text-red-600">✗ {parseResult.failed} rows failed to parse</span>
                      )}
                    </div>
                    {parseResult.errors.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-red-600 mb-1">Errors:</p>
                        <ul className="text-sm text-red-600 space-y-1">
                          {parseResult.errors.slice(0, 5).map((error, index) => (
                            <li key={index} className="text-xs">• {error}</li>
                          ))}
                          {parseResult.errors.length > 5 && (
                            <li className="text-xs">• ... and {parseResult.errors.length - 5} more</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Preview */}
            {parseResult?.success && parseResult.success.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Preview ({parseResult.success.length} runs)</CardTitle>
                  <CardDescription>
                    Here's how your data will be imported
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-64 overflow-y-auto">
                    {parseResult.success.slice(0, 3).map((run, index) => (
                      <div key={index} className="border rounded p-3 space-y-2">
                        <div className="font-medium text-sm">
                          Run {index + 1} - {format(run.timestamp, "MMM d, yyyy 'at' HH:mm")}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>Tier: {run.tier}</div>
                          <div>Wave: {formatNumber(run.wave)}</div>
                          {run.realTime > 0 && <div>Duration: {formatDuration(run.realTime)}</div>}
                          <div>Coins: {formatNumber(run.coinsEarned)}</div>
                          {run.cellsEarned > 0 && <div>Cells: {formatNumber(run.cellsEarned)}</div>}
                          {getFieldValue<string>(run, 'killedBy') && <div>Killed By: {getFieldValue<string>(run, 'killedBy')}</div>}
                          {getFieldValue<string>(run, 'notes') && <div>Notes: {getFieldValue<string>(run, 'notes')}</div>}
                        </div>
                      </div>
                    ))}
                    {parseResult.success.length > 3 && (
                      <div className="text-center text-sm text-muted-foreground">
                        ... and {parseResult.success.length - 3} more runs
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={!parseResult?.success || parseResult.success.length === 0}
            >
              Import {parseResult?.success?.length || 0} Runs
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}