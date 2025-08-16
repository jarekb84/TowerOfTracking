import { useState } from 'react';
import { Button, Textarea, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui';
import { parseGameRun } from '../utils/data-parser';
import { useData } from '../hooks/use-data';
import { Plus, Upload } from 'lucide-react';
import type { ParsedGameRun } from '../types/game-run.types';

interface DataInputProps {
  className?: string;
}

export function DataInput({ className }: DataInputProps) {
  const [inputData, setInputData] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [previewData, setPreviewData] = useState<ParsedGameRun | null>(null);
  const { addRun } = useData();

  const handlePaste = async (): Promise<void> => {
    try {
      const text = await navigator.clipboard.readText();
      setInputData(text);
      if (text.trim()) {
        const parsed = parseGameRun(text);
        setPreviewData(parsed);
      }
    } catch (error) {
      console.error('Failed to read clipboard:', error);
    }
  };

  const handleInputChange = (value: string): void => {
    setInputData(value);
    if (value.trim()) {
      try {
        const parsed = parseGameRun(value);
        setPreviewData(parsed);
      } catch (error) {
        setPreviewData(null);
      }
    } else {
      setPreviewData(null);
    }
  };

  const handleSave = (): void => {
    if (previewData) {
      addRun(previewData);
      setInputData('');
      setPreviewData(null);
      setIsDialogOpen(false);
    }
  };

  const handleCancel = (): void => {
    setInputData('');
    setPreviewData(null);
    setIsDialogOpen(false);
  };

  return (
    <div className={className}>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Game Run
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Game Run</DialogTitle>
            <DialogDescription>
              Paste your game stats below. The data should be tab-delimited with each stat on a new line.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-md">
            <div className="space-y-sm">
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
                placeholder="Paste your game stats here...
Example format:
Tier	5
Wave	127
Coins	15.2M
Cash	1.2B
Real Time	2H 45M 30S"
                value={inputData}
                onChange={(e) => handleInputChange(e.target.value)}
                rows={10}
                className="font-mono text-sm"
              />
            </div>

            {previewData && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Preview</CardTitle>
                  <CardDescription>
                    Here's how your data will be interpreted
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-md">
                    <div>
                      <h4 className="font-medium mb-sm">Key Stats</h4>
                      <div className="space-y-xs text-sm">
                        {previewData.tier && <div>Tier: {previewData.tier}</div>}
                        {previewData.wave && <div>Wave: {previewData.wave}</div>}
                        {previewData.coins && <div>Coins: {previewData.coins.toLocaleString()}</div>}
                        {previewData.cash && <div>Cash: {previewData.cash.toLocaleString()}</div>}
                        {previewData.cells && <div>Cells: {previewData.cells.toLocaleString()}</div>}
                        {previewData.duration && (
                          <div>Duration: {Math.floor(previewData.duration / 3600)}h {Math.floor((previewData.duration % 3600) / 60)}m</div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-sm">Raw Data ({Object.keys(previewData.rawData).length} fields)</h4>
                      <div className="max-h-32 overflow-y-auto text-xs space-y-1">
                        {Object.entries(previewData.rawData).slice(0, 10).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-muted-foreground">{key}:</span>
                            <span>{value}</span>
                          </div>
                        ))}
                        {Object.keys(previewData.rawData).length > 10 && (
                          <div className="text-muted-foreground italic">
                            ... and {Object.keys(previewData.rawData).length - 10} more
                          </div>
                        )}
                      </div>
                    </div>
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
              onClick={handleSave} 
              disabled={!previewData}
            >
              Save Run
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}