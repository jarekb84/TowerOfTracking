import { useState } from 'react';
import { Button, Textarea, DialogTrigger, Card, CardContent, CardDescription, CardHeader, CardTitle, Calendar, Popover, PopoverContent, PopoverTrigger, Input, FormField, FormLabel, FormControl, ResponsiveDialog, ResponsiveDialogContent, ResponsiveDialogHeader, ResponsiveDialogBody, ResponsiveDialogFooter } from '../../../components/ui';
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
      <ResponsiveDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
        trigger={
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-sm hover:shadow-md transition-shadow">
              <Plus className="h-4 w-4" />
              Add Game Run
            </Button>
          </DialogTrigger>
        }
      >
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader
            title="Add New Game Run"
            description="Paste your game stats below. The data should be tab-delimited with each stat on a new line."
          />
          
          <ResponsiveDialogBody>
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  variant="outline" 
                  onClick={form.handlePaste}
                  className="flex-1 sm:flex-initial gap-2 h-11 px-4 hover:bg-accent/80 transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  <span>Paste from Clipboard</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={importFile}
                  className="flex-1 sm:flex-initial gap-2 h-11 px-4 hover:bg-accent/80 transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  <span>Import from File</span>
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormControl label="Date" className="w-full">
                  <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="gap-2 justify-start w-full h-10 hover:bg-accent/50 transition-colors"
                      >
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground">{format(form.selectedDate, "MMM d, yyyy")}</span>
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
                
                <FormControl label="Time" className="w-full">
                  <div className="flex items-center gap-2 px-3 py-2 border border-input rounded-md bg-background hover:bg-accent/50 transition-colors">
                    <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex items-center gap-1 flex-1">
                      <Input
                        type="number"
                        min="0"
                        max="23"
                        value={form.selectedTime.hours}
                        onChange={(e) => form.handleTimeChange('hours', e.target.value)}
                        className="w-14 text-center border-0 bg-transparent focus:outline-none"
                        placeholder="HH"
                      />
                      <span className="text-muted-foreground font-semibold">:</span>
                      <Input
                        type="number"
                        min="0"
                        max="59"
                        value={form.selectedTime.minutes}
                        onChange={(e) => form.handleTimeChange('minutes', e.target.value)}
                        className="w-14 text-center border-0 bg-transparent focus:outline-none"
                        placeholder="MM"
                      />
                    </div>
                  </div>
                </FormControl>
              </div>
              
              <FormControl label="Run Type">
                <div className="grid grid-cols-3 gap-1.5">
                  <Button
                    variant={form.selectedRunType === 'farm' ? 'outline-selected' : 'outline'}
                    size="sm"
                    onClick={() => form.setSelectedRunType('farm')}
                    className="h-10 transition-all"
                  >
                    Farm
                  </Button>
                  <Button
                    variant={form.selectedRunType === 'tournament' ? 'outline-selected' : 'outline'}
                    size="sm"
                    onClick={() => form.setSelectedRunType('tournament')}
                    className="h-10 transition-all"
                  >
                    Tournament
                  </Button>
                  <Button
                    variant={form.selectedRunType === 'milestone' ? 'outline-selected' : 'outline'}
                    size="sm"
                    onClick={() => form.setSelectedRunType('milestone')}
                    className="h-10 transition-all"
                  >
                    Milestone
                  </Button>
                </div>
              </FormControl>
              <FormField>
                <FormLabel required className="text-sm font-medium text-foreground/90">
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
                  className="font-mono text-sm h-40 md:h-48 resize-none w-full border-input/60 focus:border-orange-500/40 transition-colors"
                />
              </FormField>
              
              <FormField>
                <FormLabel className="text-sm font-medium text-foreground/70">
                  Notes (optional)
                </FormLabel>
                <Textarea
                  placeholder="Add any notes about this run..."
                  value={form.notes}
                  onChange={(e) => form.setNotes(e.target.value)}
                  className="text-sm h-16 md:h-20 resize-none w-full border-input/60 focus:border-orange-500/40 transition-colors"
                />
              </FormField>
            </div>

            {form.previewData && (
              <Card className="border-orange-500/20 bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Preview</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Here${`'`}s how your data will be interpreted
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-3">
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <h4 className="font-medium text-sm mb-2 text-foreground/80">Key Stats</h4>
                      <div className="space-y-1.5 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">Type:</span>
                          <span className="text-foreground">{form.selectedRunType.charAt(0).toUpperCase() + form.selectedRunType.slice(1)}</span>
                        </div>
                        {form.previewData.realTime && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">Duration:</span>
                            <span className="text-foreground font-medium">{formatDuration(form.previewData.realTime)}</span>
                          </div>
                        )}
                        {form.previewData && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">Tier:</span>
                            <span className="text-foreground font-medium">{formatTierLabel(getFieldRaw(form.previewData, 'tier'), form.previewData.tier)}</span>
                          </div>
                        )}
                        {form.previewData.wave && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">Wave:</span>
                            <span className="text-foreground font-medium">{formatNumber(form.previewData.wave)}</span>
                          </div>
                        )}
                        {getFieldValue<string>(form.previewData, 'killedBy') && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">Killed By:</span>
                            <span className="text-foreground">{getFieldValue<string>(form.previewData, 'killedBy')}</span>
                          </div>
                        )}
                        {form.previewData.coinsEarned && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">Coins:</span>
                            <span className="text-foreground font-medium">
                              {formatNumber(form.previewData.coinsEarned)}
                              <span className="text-xs text-muted-foreground ml-1">
                                ({formatNumber(calculatePerHour(form.previewData.coinsEarned, form.previewData.realTime || 0))}/hr)
                              </span>
                            </span>
                          </div>
                        )}
                        {form.previewData.cellsEarned && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">Cells:</span>
                            <span className="text-foreground font-medium">
                              {formatNumber(form.previewData.cellsEarned)}
                              <span className="text-xs text-muted-foreground ml-1">
                                ({formatNumber(calculatePerHour(form.previewData.cellsEarned, form.previewData.realTime || 0))}/hr)
                              </span>
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">Timestamp:</span>
                          <span className="text-foreground text-xs">{format(form.previewData.timestamp, "PPp")}</span>
                        </div>
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
          </ResponsiveDialogBody>

          <ResponsiveDialogFooter mobileLayout="1-2">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              className="h-11 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-all"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!form.previewData}
              className="h-11 shadow-sm hover:shadow-md transition-all"
            >
              {form.duplicateResult?.isDuplicate 
                ? (form.resolution === 'overwrite' ? 'Overwrite Existing' : 'Skip Duplicate')
                : 'Save Run'
              }
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  );
}
