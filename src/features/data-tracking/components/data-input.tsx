import { useState } from 'react';
import { Button, Textarea, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, Card, CardContent, CardDescription, CardHeader, CardTitle, Calendar, Popover, PopoverContent, PopoverTrigger, Input, FormField, FormLabel, FormControl, ButtonGroup } from '../../../components/ui';
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
        <DialogContent className="fixed inset-0 w-full h-full max-w-none max-h-none p-0 m-0 rounded-none translate-x-0 translate-y-0 md:inset-auto md:top-[50%] md:left-[50%] md:translate-x-[-50%] md:translate-y-[-50%] md:w-auto md:h-auto md:max-w-4xl md:max-h-[80vh] md:p-6 md:m-4 md:rounded-lg overflow-y-auto flex flex-col">
          <div className="p-4 md:p-0 pb-0 md:pb-0">
            <DialogHeader>
              <DialogTitle>Add New Game Run</DialogTitle>
              <DialogDescription>
                Paste your game stats below. The data should be tab-delimited with each stat on a new line.
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 md:p-0 pt-4 md:pt-4">
            <div className="space-y-6">
              <ButtonGroup spacing="normal">
                <Button 
                  variant="outline" 
                  onClick={form.handlePaste}
                  className="gap-2"
                  fullWidthOnMobile
                >
                  <Upload className="h-4 w-4" />
                  Paste from Clipboard
                </Button>
                <Button 
                  variant="outline" 
                  onClick={importFile}
                  className="gap-2"
                  fullWidthOnMobile
                >
                  <FileText className="h-4 w-4" />
                  Import from File
                </Button>
              </ButtonGroup>
              
              <div className="flex flex-col lg:flex-row gap-4">
                <FormControl label="Date" className="lg:min-w-[240px]">
                  <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="gap-2 justify-start"
                        fullWidthOnMobile
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
                </FormControl>
                
                <FormControl label="Time" className="lg:min-w-[200px]">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex items-center gap-1">
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
                </FormControl>
              </div>
              
              <FormControl label="Run Type">
                <ButtonGroup spacing="tight">
                  <Button
                    variant={form.selectedRunType === 'farm' ? 'outline-selected' : 'outline'}
                    size="sm"
                    onClick={() => form.setSelectedRunType('farm')}
                    fullWidthOnMobile
                  >
                    Farm
                  </Button>
                  <Button
                    variant={form.selectedRunType === 'tournament' ? 'outline-selected' : 'outline'}
                    size="sm"
                    onClick={() => form.setSelectedRunType('tournament')}
                    fullWidthOnMobile
                  >
                    Tournament
                  </Button>
                  <Button
                    variant={form.selectedRunType === 'milestone' ? 'outline-selected' : 'outline'}
                    size="sm"
                    onClick={() => form.setSelectedRunType('milestone')}
                    fullWidthOnMobile
                  >
                    Milestone
                  </Button>
                </ButtonGroup>
              </FormControl>
              <FormField>
                <FormLabel required>
                  Game Stats Data
                </FormLabel>
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
                  className="font-mono text-sm h-40 md:h-48 resize-none w-full"
                />
              </FormField>
              
              <FormField>
                <FormLabel>
                  Notes (optional)
                </FormLabel>
                <Textarea
                  placeholder="Add any notes about this run..."
                  value={form.notes}
                  onChange={(e) => form.setNotes(e.target.value)}
                  className="text-sm h-16 md:h-20 resize-none w-full"
                />
              </FormField>
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

          <div className="p-4 md:p-0 pt-0 md:pt-4 border-t md:border-t-0 bg-background/95 md:bg-transparent backdrop-blur-sm md:backdrop-blur-none sticky bottom-0 md:relative">
            <DialogFooter className="gap-2">
              <Button 
                variant="outline" 
                onClick={handleCancel} 
                fullWidthOnMobile
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={!form.previewData}
                fullWidthOnMobile
              >
                {form.duplicateResult?.isDuplicate 
                  ? (form.resolution === 'overwrite' ? 'Overwrite Existing' : 'Skip Duplicate')
                  : 'Save Run'
                }
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
