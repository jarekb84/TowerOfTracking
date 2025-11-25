import type { RunTypeValue } from '@/shared/types/game-run.types';
import { useEditingKeyboardShortcuts } from './use-editing-keyboard-shortcuts';
import { EditActionButtons } from './edit-action-buttons';
import { EditIconButton } from './edit-icon-button';
import { ClickableFieldDisplay, FieldValue } from './clickable-field-display';
import { RunTypeSelector } from '@/shared/domain/run-types/run-type-selector';
import { RunType } from '@/shared/domain/run-types/types';
import type { RunTypeFilter } from '@/features/analysis/shared/filtering/run-type-filter';
import { useState } from 'react';
import { NotesField } from '@/shared/domain/fields/notes-field';
import { RankSelector } from '@/shared/domain/fields/rank-selector';
import type { RankValue } from './field-update-logic';

interface EditableUserFieldsProps {
  notes: string;
  runType: RunTypeValue;
  rank: RankValue;
  onSave: (newNotes: string, newRunType: RunTypeValue, newRank: RankValue) => void;
}

export function EditableUserFields({
  notes,
  runType,
  rank,
  onSave
}: EditableUserFieldsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState(notes);
  const [editedRunType, setEditedRunType] = useState<RunTypeValue>(runType);
  const [editedRank, setEditedRank] = useState<RankValue>(rank);
  const [isSaving, setIsSaving] = useState(false);

  const { handleTextareaKeyDown } = useEditingKeyboardShortcuts({
    onSave: handleSave,
    onCancel: handleCancel,
  });

  const isEmpty = !notes || notes.trim() === '';
  const isTournament = editedRunType === RunType.TOURNAMENT;

  function startEditing() {
    setEditedNotes(notes);
    setEditedRunType(runType);
    setEditedRank(rank);
    setIsEditing(true);
  }

  function handleCancel() {
    setEditedNotes(notes);
    setEditedRunType(runType);
    setEditedRank(rank);
    setIsEditing(false);
  }

  function handleRunTypeChange(type: RunTypeFilter) {
    const newType = type === 'all' ? RunType.FARM : type;
    setEditedRunType(newType);
    // Clear rank when switching away from tournament
    if (newType !== RunType.TOURNAMENT) {
      setEditedRank('');
    }
  }

  async function handleSave() {
    setIsSaving(true);

    // Defer to next tick so loading state shows immediately
    await new Promise(resolve => setTimeout(resolve, 0));

    // Clear rank if not tournament type (handle edge case of type change)
    const finalRank = editedRunType === RunType.TOURNAMENT ? editedRank : '';

    // Apply all updates in a single call
    onSave(editedNotes, editedRunType, finalRank);

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
          {/* Run Type and Rank Fields - same row */}
          <div className="flex items-start gap-6">
            <RunTypeSelector
              selectedType={editedRunType as RunTypeFilter}
              onTypeChange={handleRunTypeChange}
              mode="selection"
            />

            {/* Rank Field - only shown for tournament runs */}
            {isTournament && (
              <RankSelector
                value={editedRank}
                onChange={setEditedRank}
              />
            )}
          </div>

          {/* Notes Field */}
          <NotesField
            value={editedNotes}
            onChange={setEditedNotes}
            onKeyDown={handleTextareaKeyDown}
            id="notes-textarea"
          />
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
  const isReadOnlyTournament = runType === RunType.TOURNAMENT;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-border/40 pb-2">
        <h5 className="font-semibold text-base text-primary">
          User Fields
        </h5>
        <EditIconButton onClick={startEditing} label="Edit user fields" />
      </div>

      <div className="space-y-3">
        {/* Run Type and Rank Display - same row */}
        <div className="flex items-start gap-6">
          <ClickableFieldDisplay label="Run Type" onClick={startEditing}>
            <FieldValue>
              <span className="capitalize">{runType}</span>
            </FieldValue>
          </ClickableFieldDisplay>

          {/* Rank Display - only shown for tournament runs */}
          {isReadOnlyTournament && (
            <ClickableFieldDisplay label="Rank" onClick={startEditing}>
              {rank === '' ? (
                <FieldValue variant="empty">Not set</FieldValue>
              ) : (
                <FieldValue>{rank}</FieldValue>
              )}
            </ClickableFieldDisplay>
          )}
        </div>

        {/* Notes Display */}
        <ClickableFieldDisplay label="Notes" onClick={startEditing} variant="stacked">
          {isEmpty ? (
            <span className="text-muted-foreground/50 italic text-sm">
              Click to add notes for this run...
            </span>
          ) : (
            <p className="text-left whitespace-pre-wrap break-words leading-relaxed text-foreground/90">
              {notes}
            </p>
          )}
        </ClickableFieldDisplay>
      </div>
    </div>
  );
}
