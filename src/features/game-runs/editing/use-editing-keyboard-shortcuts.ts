import { useCallback } from 'react';

export interface UseEditingKeyboardShortcutsOptions {
  onSave: () => void;
  onCancel: () => void;
  saveShortcut?: 'enter' | 'ctrl-enter';
}

export interface UseEditingKeyboardShortcutsReturn {
  handleTextareaKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  handleSelectKeyDown: (e: React.KeyboardEvent<HTMLSelectElement>) => void;
}

/**
 * Hook for consistent keyboard shortcut handling across editable fields
 */
export function useEditingKeyboardShortcuts({
  onSave,
  onCancel,
  saveShortcut = 'ctrl-enter',
}: UseEditingKeyboardShortcutsOptions): UseEditingKeyboardShortcutsReturn {
  const handleTextareaKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (saveShortcut === 'ctrl-enter') {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          onSave();
        }
      } else if (saveShortcut === 'enter') {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          onSave();
        }
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    },
    [onSave, onCancel, saveShortcut]
  );

  const handleSelectKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLSelectElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onSave();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    },
    [onSave, onCancel]
  );

  return {
    handleTextareaKeyDown,
    handleSelectKeyDown,
  };
}
