import type { RunTypeValue } from '@/shared/types/game-run.types';
import { useEditableField } from './use-editable-field';
import { useEditingKeyboardShortcuts } from './use-editing-keyboard-shortcuts';
import { EditActionButtons } from './edit-action-buttons';
import { EditIconButton } from './edit-icon-button';
import { cn } from '@/shared/lib/utils';

interface EditableRunTypeProps {
  runType: RunTypeValue;
  onSave: (newRunType: RunTypeValue) => void;
}

const RUN_TYPE_OPTIONS: { value: RunTypeValue; label: string }[] = [
  { value: 'farm', label: 'Farm' },
  { value: 'tournament', label: 'Tournament' },
  { value: 'milestone', label: 'Milestone' },
];

export function EditableRunType({ runType, onSave }: EditableRunTypeProps) {
  const {
    value,
    isEditing,
    startEditing,
    cancelEditing,
    handleChange,
    saveEdit,
  } = useEditableField({
    initialValue: runType,
    onSave,
  });

  const { handleSelectKeyDown } = useEditingKeyboardShortcuts({
    onSave: saveEdit,
    onCancel: cancelEditing,
  });

  const currentLabel = RUN_TYPE_OPTIONS.find(opt => opt.value === runType)?.label || runType;

  if (isEditing) {
    return (
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <span className="font-mono text-sm text-muted-foreground min-w-[80px]">Run Type</span>
          <div className="flex items-center gap-2 flex-1">
            <select
              value={value}
              onChange={(e) => handleChange(e.target.value as RunTypeValue)}
              onKeyDown={handleSelectKeyDown}
              className={cn(
                'px-3 py-2 rounded-md border border-input bg-background text-foreground',
                'focus:outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                'transition-colors shadow-xs min-h-[44px] [@media(pointer:coarse)]:min-h-[44px]',
                'flex-1 sm:flex-initial sm:min-w-[140px]'
              )}
            >
              {RUN_TYPE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="hidden sm:block">
              <EditActionButtons
                onSave={saveEdit}
                onCancel={cancelEditing}
                size="sm"
              />
            </div>
          </div>
        </div>
        <div className="flex sm:hidden">
          <EditActionButtons
            onSave={saveEdit}
            onCancel={cancelEditing}
            fullWidthOnMobile
          />
        </div>
        <span className="text-xs text-muted-foreground block sm:hidden">
          Enter to save, Esc to cancel
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm text-muted-foreground min-w-[80px]">Run Type</span>
        <span className="font-mono text-sm text-accent font-medium">{currentLabel}</span>
      </div>
      <EditIconButton
        onClick={startEditing}
        label="Edit run type"
        className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity duration-200"
      />
    </div>
  );
}
