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
          
          <div className="space-y-4">
            <div className="space-y-2">
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
Game Time        1d 13h 24m 51s
Real Time        7h 46m 6s
Tier        10
Wave        5881
Coins Earned        1.13T
Cash Earned        $44.65B"
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Key Stats</h4>
                      <div className="space-y-1 text-sm">
                        {previewData.tier && <div>Tier: {previewData.tier}</div>}
                        {previewData.wave && <div>Wave: {previewData.wave}</div>}
                        {previewData.coinsEarned && <div>Coins: {previewData.coinsEarned.toLocaleString()}</div>}
                        {previewData.cashEarned && <div>Cash: {previewData.cashEarned.toLocaleString()}</div>}
                        {previewData.cellsEarned && <div>Cells: {previewData.cellsEarned.toLocaleString()}</div>}
                        {previewData.gameTime && (
                          <div>Game Time: {Math.floor(previewData.gameTime / 86400)}d {Math.floor((previewData.gameTime % 86400) / 3600)}h {Math.floor((previewData.gameTime % 3600) / 60)}m</div>
                        )}
                        {previewData.realTime && (
                          <div>Real Time: {Math.floor(previewData.realTime / 3600)}h {Math.floor((previewData.realTime % 3600) / 60)}m</div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Raw Data ({Object.keys(previewData.rawData || {}).length} fields)</h4>
                      <div className="max-h-32 overflow-y-auto text-xs space-y-1">
                        {Object.entries(previewData.rawData || {}).slice(0, 10).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-muted-foreground">{key}:</span>
                            <span>{value}</span>
                          </div>
                        ))}
                        {Object.keys(previewData.rawData || {}).length > 10 && (
                          <div className="text-muted-foreground italic">
                            ... and {Object.keys(previewData.rawData || {}).length - 10} more
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