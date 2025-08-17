import { useState } from 'react';
import { Button, Textarea, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui';
import { format } from 'date-fns';
import { Upload, FileText } from 'lucide-react';
import { parseCsvData, formatNumber, formatDuration } from '../utils/data-parser';
import { getFieldValue } from '../utils/field-utils';
import { useData } from '../hooks/use-data';
import type { ParsedGameRun } from '../types/game-run.types';

interface CsvImportProps {
  className?: string;
}

export function CsvImport({ className }: CsvImportProps) {
  const [inputData, setInputData] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [previewData, setPreviewData] = useState<ParsedGameRun[]>([]);
  const [importStatus, setImportStatus] = useState<{ success: number; failed: number; errors: string[] }>({ success: 0, failed: 0, errors: [] });
  const { addRun } = useData();

  const handlePaste = async (): Promise<void> => {
    try {
      const text = await navigator.clipboard.readText();
      setInputData(text);
      if (text.trim()) {
        const parsed = parseCsvData(text);
        setPreviewData(parsed.success);
        setImportStatus({ success: parsed.success.length, failed: parsed.failed.length, errors: parsed.errors });
      }
    } catch (error) {
      console.error('Failed to read clipboard:', error);
    }
  };

  const handleInputChange = (value: string): void => {
    setInputData(value);
    if (value.trim()) {
      try {
        const parsed = parseCsvData(value);
        setPreviewData(parsed.success);
        setImportStatus({ success: parsed.success.length, failed: parsed.failed.length, errors: parsed.errors });
      } catch (error) {
        setPreviewData([]);
        setImportStatus({ success: 0, failed: 0, errors: ['Failed to parse data'] });
      }
    } else {
      setPreviewData([]);
      setImportStatus({ success: 0, failed: 0, errors: [] });
    }
  };

  const handleImport = (): void => {
    previewData.forEach(run => {
      addRun(run);
    });
    setInputData('');
    setPreviewData([]);
    setImportStatus({ success: 0, failed: 0, errors: [] });
    setIsDialogOpen(false);
  };

  const handleCancel = (): void => {
    setInputData('');
    setPreviewData([]);
    setImportStatus({ success: 0, failed: 0, errors: [] });
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
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import CSV/Tab-Delimited Data</DialogTitle>
            <DialogDescription>
              Import game run data from CSV or tab-delimited format. Expected columns: Date, Time, Tier, Wave, Hrs, Min, Sec, Duration, Coins, Cells, CellsPerHour, CoinsPerHour, CoinsPerDay, Killed By, Notes
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handlePaste}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Paste from Clipboard
                </Button>
              </div>
              
              <Textarea
                placeholder="Paste your CSV/TSV data here...
Example format:
Date,Time,Tier,Wave,Hrs,Min,Sec,Duration,Coins,Cells,CellsPerHour,CoinsPerHour,CoinsPerDay,Killed By,Notes
2024-01-15,14:30,10,5881,7,46,6,7H 46M 6S,1.13T,45.2K,,,,$1.5B,Wall,Good run
2024-01-16,16:20,11,6200,8,12,30,8H 12M 30S,1.45T,52.1K,,,,$1.8B,Elite,,
"
                value={inputData}
                onChange={(e) => handleInputChange(e.target.value)}
                className="font-mono text-sm h-48 resize-none"
              />
            </div>

            {/* Import Status */}
            {(importStatus.success > 0 || importStatus.failed > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Import Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex gap-4 text-sm">
                      <span className="text-green-600">✓ {importStatus.success} runs will be imported</span>
                      {importStatus.failed > 0 && (
                        <span className="text-red-600">✗ {importStatus.failed} rows failed to parse</span>
                      )}
                    </div>
                    {importStatus.errors.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-red-600 mb-1">Errors:</p>
                        <ul className="text-sm text-red-600 space-y-1">
                          {importStatus.errors.slice(0, 5).map((error, index) => (
                            <li key={index} className="text-xs">• {error}</li>
                          ))}
                          {importStatus.errors.length > 5 && (
                            <li className="text-xs">• ... and {importStatus.errors.length - 5} more</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Preview */}
            {previewData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Preview ({previewData.length} runs)</CardTitle>
                  <CardDescription>
                    Here's how your data will be imported
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-64 overflow-y-auto">
                    {previewData.slice(0, 3).map((run, index) => (
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
                    {previewData.length > 3 && (
                      <div className="text-center text-sm text-muted-foreground">
                        ... and {previewData.length - 3} more runs
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
              disabled={previewData.length === 0}
            >
              Import {previewData.length} Runs
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}