import { useState } from 'react';
import { Button, Textarea, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, Card, CardContent, CardDescription, CardHeader, CardTitle, Calendar, Popover, PopoverContent, PopoverTrigger, Input } from '../../../components/ui';
import { format } from 'date-fns';
import { CalendarIcon, Clock } from 'lucide-react';
import { formatNumber, formatDuration, calculatePerHour, formatTierLabel } from '../utils/data-parser';
import { getFieldValue, getFieldRaw } from '../utils/field-utils';
import { useFileImport } from '../hooks/use-file-import';
import { useDataInputForm } from '../hooks/use-data-input-form';
import { Plus, Upload, FileText } from 'lucide-react';
import { DuplicateInfo } from './duplicate-info';

interface DataInputProps {
  className?: string;
}

export function DataInput({ className }: DataInputProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
  
  const form = useDataInputForm();


  const { importFile } = useFileImport({
    onFileContent: (text) => {
      form.setInputData(text);
      form.handleInputChange(text);
    },
    onError: (error) => {
      console.error('Failed to import file:', error);
    }
  });

  const handleCancel = (): void => {
    form.resetForm();
    setIsDialogOpen(false);
  };

  const handleSave = (): void => {
    form.handleSave();
    setIsDialogOpen(false);
  };

  const handleDateSelect = (date: Date | undefined): void => {
    if (date) {
      form.handleDateSelect(date);
      setIsDatePopoverOpen(false);
    }
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
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={form.handlePaste}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Paste from Clipboard
                </Button>
                <Button 
                  variant="outline" 
                  onClick={importFile}
                  className="gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Import from File
                </Button>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Date:</span>
                  <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="gap-2 min-w-[180px] justify-start"
                      >
                        <CalendarIcon className="h-4 w-4" />
                        {format(form.selectedDate, "MMM d, yyyy")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={form.selectedDate}
                        onSelect={handleDateSelect}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Time:</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      min="0"
                      max="23"
                      value={form.selectedTime.hours}
                      onChange={(e) => form.handleTimeChange('hours', e.target.value)}
                      className="w-16 text-center"
                      placeholder="HH"
                    />
                    <span className="text-muted-foreground">:</span>
                    <Input
                      type="number"
                      min="0"
                      max="59"
                      value={form.selectedTime.minutes}
                      onChange={(e) => form.handleTimeChange('minutes', e.target.value)}
                      className="w-16 text-center"
                      placeholder="MM"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Run Type:</span>
                <div className="flex gap-1">
                  <Button
                    variant={form.selectedRunType === 'farm' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => form.setSelectedRunType('farm')}
                    className="h-8 px-3"
                  >
                    Farm
                  </Button>
                  <Button
                    variant={form.selectedRunType === 'tournament' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => form.setSelectedRunType('tournament')}
                    className="h-8 px-3"
                  >
                    Tournament
                  </Button>
                  <Button
                    variant={form.selectedRunType === 'milestone' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => form.setSelectedRunType('milestone')}
                    className="h-8 px-3"
                  >
                    Milestone
                  </Button>
                </div>
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
                value={form.inputData}
                onChange={(e) => form.handleInputChange(e.target.value)}
                className="font-mono text-sm h-48 resize-none"
              />
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Notes (optional)
                </label>
                <Textarea
                  placeholder="Add any notes about this run..."
                  value={form.notes}
                  onChange={(e) => form.setNotes(e.target.value)}
                  className="text-sm h-20 resize-none"
                />
              </div>
            </div>

            {form.previewData && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Preview</CardTitle>
                  <CardDescription>
                    Here${`'`}s how your data will be interpreted
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Key Stats</h4>
                      <div className="space-y-1 text-sm">
                        <div>Run Type: {form.selectedRunType.charAt(0).toUpperCase() + form.selectedRunType.slice(1)}</div>
                        {form.previewData.realTime && (
                          <div>Real Time: {formatDuration(form.previewData.realTime)}</div>
                        )}
                        {form.previewData && (
                          <div>
                            Tier: {formatTierLabel(getFieldRaw(form.previewData, 'tier'), form.previewData.tier)}
                          </div>
                        )}
                        {form.previewData.wave && <div>Wave: {formatNumber(form.previewData.wave)}</div>}
                        {getFieldValue<string>(form.previewData, 'killedBy') && <div>Killed By: {getFieldValue<string>(form.previewData, 'killedBy')}</div>}
                        {form.previewData.coinsEarned && (
                          <div>
                            Coins: {formatNumber(form.previewData.coinsEarned)} (
                            {formatNumber(calculatePerHour(form.previewData.coinsEarned, form.previewData.realTime || 0))}/hr)
                          </div>
                        )}
                        {form.previewData.cellsEarned && (
                          <div>
                            Cells: {formatNumber(form.previewData.cellsEarned)} (
                            {formatNumber(calculatePerHour(form.previewData.cellsEarned, form.previewData.realTime || 0))}/hr)
                          </div>
                        )}
                        <div>Timestamp: {format(form.previewData.timestamp, "PPp")}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Duplicate Detection - shows immediately when duplicates are found */}
            {form.duplicateResult?.isDuplicate && form.previewData && (
              <DuplicateInfo
                singleResult={form.duplicateResult}
                newRun={form.previewData}
                onResolutionChange={form.setResolution}
                resolution={form.resolution}
                className="mt-4"
              />
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!form.previewData}
            >
              {form.duplicateResult?.isDuplicate 
                ? (form.resolution === 'overwrite' ? 'Overwrite Existing' : 'Skip Duplicate')
                : 'Save Run'
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
