import { useState, memo } from 'react';
import { Button, Textarea, FormField, FormLabel, ResponsiveDialog, ResponsiveDialogContent, ResponsiveDialogHeader, ResponsiveDialogBody, ResponsiveDialogFooter } from '../../../components/ui';
import { useFileImport } from '../csv-import/input/csv-file-upload';
import { useDataInputForm } from './use-data-input-form';
import { useGlobalDataInput } from './use-global-data-input';
import { DuplicateInfo } from '../../data-tracking/components/duplicate-info';
import { DataInputPreview } from './data-input-preview';
import { DataInputActionsSection } from './data-input-actions-section';
import { DataInputDateTimeSection } from './data-input-datetime-section';
import { RunTypeSelector } from '../../data-tracking/components/run-type-selector';
import { RunTypeFilter } from '../../data-tracking/utils/run-type-filter';
import { RunType } from '../../data-tracking/types/game-run.types';

interface DataInputProps {
  className?: string;
}

const DataInputComponent = function DataInput({ className }: DataInputProps) {
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
    <ResponsiveDialog 
      open={isDialogOpen} 
      onOpenChange={(open) => { if (!open) closeDialog(); }}
    >
        <ResponsiveDialogContent className={className}>
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
                disabled={form.hasBattleDate}
                disabledReason={form.hasBattleDate ? "Using game timestamp" : undefined}
              />
              
              <RunTypeSelector
                selectedType={form.selectedRunType as RunTypeFilter}
                onTypeChange={(type) => form.setSelectedRunType(type === 'all' ? RunType.FARM : type)}
                mode="selection"
              />
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
                  className="form-textarea font-mono text-sm h-40 md:h-48"
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
                  className="form-textarea text-sm h-16 md:h-20"
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
              className="h-10 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-all duration-200"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!form.previewData}
              className="h-10 shadow-sm hover:shadow-md transition-all duration-200 disabled:shadow-none"
            >
              {form.duplicateResult?.isDuplicate 
                ? (form.resolution === 'overwrite' ? 'Overwrite Existing' : 'Skip Duplicate')
                : 'Save Run'
              }
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
};

// Memoize to prevent unnecessary re-renders when parent components change
// Only re-renders if className prop changes (which should be rare)
export const DataInput = memo(DataInputComponent);
