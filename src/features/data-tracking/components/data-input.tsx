import { useState } from 'react';
import { Button, Textarea, DialogTrigger, FormField, FormLabel, FormControl, ResponsiveDialog, ResponsiveDialogContent, ResponsiveDialogHeader, ResponsiveDialogBody, ResponsiveDialogFooter } from '../../../components/ui';
import { useFileImport } from '../hooks/use-file-import';
import { useDataInputForm } from '../hooks/use-data-input-form';
import { useGlobalDataInput } from '../hooks/use-global-data-input';
import { Plus } from 'lucide-react';
import { DuplicateInfo } from './duplicate-info';
import { DataInputPreview } from './data-input-preview';
import { DataInputActionsSection } from './data-input-actions-section';
import { DataInputDateTimeSection } from './data-input-datetime-section';

interface DataInputProps {
  className?: string;
}

export function DataInput({ className }: DataInputProps) {
  const { isDialogOpen, closeDialog } = useGlobalDataInput();
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
    closeDialog();
  };

  const handleSave = (): void => {
    form.handleSave();
    closeDialog();
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
        onOpenChange={(open) => { if (!open) closeDialog(); }}
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
            description="Paste your game stats below"
          />
          
          <ResponsiveDialogBody>
            <div className="space-y-5">
              <DataInputActionsSection 
                onPaste={form.handlePaste}
                onImportFile={importFile}
              />
              
              <DataInputDateTimeSection 
                selectedDate={form.selectedDate}
                selectedTime={form.selectedTime}
                isDatePopoverOpen={isDatePopoverOpen}
                onDatePopoverOpenChange={setIsDatePopoverOpen}
                onDateSelect={handleDateSelect}
                onTimeChange={form.handleTimeChange}
              />
              
              <FormControl label="Run Type">
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={form.selectedRunType === 'farm' ? 'outline-selected' : 'outline'}
                    size="sm"
                    onClick={() => form.setSelectedRunType('farm')}
                    className="h-10 transition-all duration-200 font-medium"
                  >
                    Farm
                  </Button>
                  <Button
                    variant={form.selectedRunType === 'tournament' ? 'outline-selected' : 'outline'}
                    size="sm"
                    onClick={() => form.setSelectedRunType('tournament')}
                    className="h-10 transition-all duration-200 font-medium"
                  >
                    Tournament
                  </Button>
                  <Button
                    variant={form.selectedRunType === 'milestone' ? 'outline-selected' : 'outline'}
                    size="sm"
                    onClick={() => form.setSelectedRunType('milestone')}
                    className="h-10 transition-all duration-200 font-medium"
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
                  className="font-mono text-sm h-40 md:h-48 resize-none w-full bg-background border-input/60 hover:border-accent/50 focus:border-orange-500/60 focus:bg-orange-500/5 transition-all duration-200 placeholder:text-muted-foreground/60"
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
                  className="text-sm h-16 md:h-20 resize-none w-full bg-background border-input/60 hover:border-accent/50 focus:border-orange-500/60 focus:bg-orange-500/5 transition-all duration-200 placeholder:text-muted-foreground/60"
                />
              </FormField>
            </div>

            {form.previewData && (
              <DataInputPreview 
                previewData={form.previewData} 
                selectedRunType={form.selectedRunType}
              />
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
              className="h-11 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-all duration-200"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!form.previewData}
              className="h-11 shadow-sm hover:shadow-md transition-all duration-200 disabled:shadow-none"
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
