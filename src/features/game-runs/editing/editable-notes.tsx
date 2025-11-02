import { StickyNote } from 'lucide-react';
import { useEditableField } from './use-editable-field';
import { useEditingKeyboardShortcuts } from './use-editing-keyboard-shortcuts';
import { Textarea } from '@/components/ui/textarea';
import { EditActionButtons } from './edit-action-buttons';
import { EditIconButton } from './edit-icon-button';
import { cn } from '@/shared/lib/utils';

interface EditableNotesProps {
  notes: string;
  onSave: (newNotes: string) => void;
}

export function EditableNotes({ notes, onSave }: EditableNotesProps) {
  const {
    value,
    isEditing,
    startEditing,
    cancelEditing,
    handleChange,
    saveEdit,
  } = useEditableField({
    initialValue: notes,
    onSave,
  });

  const { handleTextareaKeyDown } = useEditingKeyboardShortcuts({
    onSave: saveEdit,
    onCancel: cancelEditing,
  });

  const isEmpty = !notes || notes.trim() === '';

  if (isEditing) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h5 className="font-semibold text-base text-primary border-b border-border/40 pb-2 flex items-center gap-2">
            <StickyNote className="h-4 w-4 text-accent" />
            Notes
            <span className="text-xs text-muted-foreground font-normal">(editing)</span>
          </h5>
        </div>
        <Textarea
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleTextareaKeyDown}
          className="min-h-[100px] resize-y"
          placeholder="Add notes for this run..."
        />
        <div className="flex items-center justify-between">
          <EditActionButtons onSave={saveEdit} onCancel={cancelEditing} />
          <span className="text-xs text-muted-foreground">
            Cmd+Enter to save, Esc to cancel
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h5 className="font-semibold text-base text-primary border-b border-border/40 pb-2 flex items-center gap-2">
          <StickyNote className="h-4 w-4 text-accent" />
          Notes
        </h5>
        <EditIconButton onClick={startEditing} label="Edit notes" />
      </div>
      <div
        className={cn(
          'cursor-pointer p-3 rounded-md transition-all duration-200',
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
  );
}
