import type { RunTypeValue } from '@/shared/types/game-run.types';
import { useEditingKeyboardShortcuts } from './use-editing-keyboard-shortcuts';
import { Textarea } from '@/components/ui/textarea';
import { EditActionButtons } from './edit-action-buttons';
import { EditIconButton } from './edit-icon-button';
import { RunTypeSelector } from '@/shared/domain/run-types/run-type-selector';
import { RunType } from '@/shared/domain/run-types/types';
import type { RunTypeFilter } from '@/features/analysis/shared/filtering/run-type-filter';
import { cn } from '@/shared/lib/utils';
import { useState } from 'react';

interface EditableUserFieldsProps {
  notes: string;
  runType: RunTypeValue;
  onSave: (newNotes: string, newRunType: RunTypeValue) => void;
}

export function EditableUserFields({
  notes,
  runType,
  onSave
}: EditableUserFieldsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState(notes);
  const [editedRunType, setEditedRunType] = useState<RunTypeValue>(runType);
  const [isSaving, setIsSaving] = useState(false);

  const { handleTextareaKeyDown } = useEditingKeyboardShortcuts({
    onSave: handleSave,
    onCancel: handleCancel,
  });

  const isEmpty = !notes || notes.trim() === '';

  function startEditing() {
    setEditedNotes(notes);
    setEditedRunType(runType);
    setIsEditing(true);
  }

  function handleCancel() {
    setEditedNotes(notes);
    setEditedRunType(runType);
    setIsEditing(false);
  }

  async function handleSave() {
    setIsSaving(true);

    // Defer to next tick so loading state shows immediately
    await new Promise(resolve => setTimeout(resolve, 0));

    // Apply both updates in a single call
    onSave(editedNotes, editedRunType);

    // Brief delay to show loading feedback (localStorage save is now debounced/async)
    await new Promise(resolve => setTimeout(resolve, 100));

    setIsSaving(false);
    setIsEditing(false);
  }

  // Show loading state in edit mode while saving
  if (isEditing || isSaving) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border/40 pb-2">
          <h5 className="font-semibold text-base text-primary flex items-center gap-2">
            User Fields
            <span className="text-xs text-muted-foreground font-normal">(editing)</span>
          </h5>
        </div>

        <div className="space-y-4">
          {/* Run Type Field */}
          <RunTypeSelector
            selectedType={editedRunType as RunTypeFilter}
            onTypeChange={(type) => setEditedRunType(type === 'all' ? RunType.FARM : type)}
            mode="selection"
          />

          {/* Notes Field */}
          <div className="space-y-2">
            <label htmlFor="notes-textarea" className="text-sm font-medium text-muted-foreground">
              Notes
            </label>
            <Textarea
              id="notes-textarea"
              value={editedNotes}
              onChange={(e) => setEditedNotes(e.target.value)}
              onKeyDown={handleTextareaKeyDown}
              className="min-h-[100px] resize-y"
              placeholder="Add notes for this run..."
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <EditActionButtons
            onSave={handleSave}
            onCancel={handleCancel}
            disabled={isSaving}
          />
          <span className="text-xs text-muted-foreground">
            Cmd+Enter to save, Esc to cancel
          </span>
        </div>
      </div>
    );
  }

  // Read-only view
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-border/40 pb-2">
        <h5 className="font-semibold text-base text-primary">
          User Fields
        </h5>
        <EditIconButton onClick={startEditing} label="Edit user fields" />
      </div>

      <div className="space-y-3">
        {/* Run Type Display */}
        <div
          className={cn(
            'flex items-center gap-3 p-2 rounded-md cursor-pointer',
            'hover:bg-accent/5 hover:border-accent/20 border border-transparent'
          )}
          onClick={startEditing}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              startEditing();
            }
          }}
        >
          <span className="font-mono text-sm text-muted-foreground min-w-[80px]">
            Run Type
          </span>
          <span className="font-mono text-sm text-accent font-medium capitalize">
            {runType}
          </span>
        </div>

        {/* Notes Display */}
        <div
          className={cn(
            'cursor-pointer p-3 rounded-md',
            'hover:bg-accent/5 hover:border-accent/20 border border-transparent',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50'
          )}
          onClick={startEditing}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              startEditing();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Click to edit notes"
        >
          <div className="mb-2">
            <span className="font-mono text-sm text-muted-foreground">Notes</span>
          </div>
          {isEmpty ? (
            <span className="text-muted-foreground/50 italic text-sm">
              Click to add notes for this run...
            </span>
          ) : (
            <p className="text-left whitespace-pre-wrap break-words leading-relaxed text-foreground/90">
              {notes}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
