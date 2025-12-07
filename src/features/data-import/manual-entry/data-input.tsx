import { useState, memo } from 'react';
import { Button, Textarea, FormField, FormLabel, ResponsiveDialog, ResponsiveDialogContent, ResponsiveDialogHeader, ResponsiveDialogBody, ResponsiveDialogFooter } from '@/components/ui';
import { useFileImport } from '../csv-import/input/csv-file-upload';
import { FormatMismatchWarning } from '../csv-import/format-warning';
import { useDataInputForm } from './use-data-input-form';
import { useGlobalDataInput } from './use-global-data-input';
import { DuplicateInfo } from '@/shared/domain/duplicate-detection/duplicate-info';
import { DataInputPreview } from './data-input-preview';
import { DataInputActionsSection } from './data-input-actions-section';
import { DataInputDateTimeSection } from './data-input-datetime-section';
import { SingleEntryDateWarning } from './single-entry-date-warning';
import { RunTypeSelector } from '@/shared/domain/run-types/run-type-selector';
import { RunTypeFilter } from '@/features/analysis/shared/filtering/run-type-filter';
import { RunType } from '@/shared/domain/run-types/types';
import { NotesField } from '@/shared/domain/fields/notes-field';
import { RankSelector } from '@/shared/domain/fields/rank-selector';

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

  /**
   * Reset form state and close the modal.
   * Used for all modal close scenarios: Cancel, X button, ESC, clicking outside,
   * navigating away via links, and after saving.
   * This ensures stale parsed data never persists when modal reopens.
   */
  const closeModal = (): void => {
    form.resetForm();
    closeDialog();
  };

  const handleSave = (): void => {
    form.handleSave();
    closeModal();
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
      onOpenChange={(open) => {
        if (!open) closeModal();
      }}
    >
        <ResponsiveDialogContent className={className}>
          <ResponsiveDialogHeader
            title="Add New Game Run"
            description="Paste your game stats below"
          />
          
          <ResponsiveDialogBody>
            {/* Format Mismatch Warning - shows when data format doesn't match settings */}
            {form.previewData && (
              <FormatMismatchWarning
                parsedRuns={[form.previewData]}
                className="mb-5"
                onSettingsClick={closeModal}
              />
            )}

            {/* Date Validation Warning - shows when battleDate field has invalid value */}
            {form.previewData?.dateValidationError && (
              <SingleEntryDateWarning
                error={form.previewData.dateValidationError}
                className="mb-5"
              />
            )}

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
              
              {/* Run Type and Rank - same row */}
              <div className="flex items-start gap-6">
                <RunTypeSelector
                  selectedType={form.selectedRunType as RunTypeFilter}
                  onTypeChange={(type) => form.handleRunTypeChange(type === 'all' ? RunType.FARM : type)}
                  mode="selection"
                />

                {/* Rank selector - only shown for tournament runs */}
                {form.selectedRunType === RunType.TOURNAMENT && (
                  <RankSelector
                    value={form.rank}
                    onChange={form.setRank}
                    showOptionalHint
                  />
                )}
              </div>

              <FormField>
                <FormLabel required>
                  Game Stats Data
                </FormLabel>
                <Textarea
                  placeholder="Paste your game stats here...
Example format:
Battle Report
Battle Date	Nov 02, 2025 09:05
Game Time	2d 8h 53m 17s
Real Time	11h 39m 16s
Tier	11
Wave	8633
Killed By	Scatter
Coins earned	10.02T
Coins per hour	860.06B"
                  value={form.inputData}
                  onChange={(e) => form.handleInputChange(e.target.value)}
                  className="form-textarea font-mono text-sm h-40 md:h-48"
                />
              </FormField>
              
              <NotesField
                label="Notes (optional)"
                value={form.notes}
                onChange={form.setNotes}
                placeholder="Add any notes about this run..."
                textareaClassName="form-textarea text-sm h-16 md:h-20"
              />
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
              onClick={closeModal}
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
