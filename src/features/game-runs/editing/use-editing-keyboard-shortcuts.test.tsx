import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useEditingKeyboardShortcuts } from './use-editing-keyboard-shortcuts';

describe('useEditingKeyboardShortcuts', () => {
  describe('handleTextareaKeyDown', () => {
    describe('with ctrl-enter save shortcut (default)', () => {
      it('should call onSave when Ctrl+Enter is pressed', () => {
        const onSave = vi.fn();
        const onCancel = vi.fn();
        const { result } = renderHook(() =>
          useEditingKeyboardShortcuts({ onSave, onCancel })
        );

        const event = {
          key: 'Enter',
          ctrlKey: true,
          metaKey: false,
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent<HTMLTextAreaElement>;

        result.current.handleTextareaKeyDown(event);

        expect(event.preventDefault).toHaveBeenCalled();
        expect(onSave).toHaveBeenCalled();
        expect(onCancel).not.toHaveBeenCalled();
      });

      it('should call onSave when Cmd+Enter is pressed (Mac)', () => {
        const onSave = vi.fn();
        const onCancel = vi.fn();
        const { result } = renderHook(() =>
          useEditingKeyboardShortcuts({ onSave, onCancel })
        );

        const event = {
          key: 'Enter',
          ctrlKey: false,
          metaKey: true,
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent<HTMLTextAreaElement>;

        result.current.handleTextareaKeyDown(event);

        expect(event.preventDefault).toHaveBeenCalled();
        expect(onSave).toHaveBeenCalled();
      });

      it('should NOT call onSave when Enter is pressed without modifier', () => {
        const onSave = vi.fn();
        const onCancel = vi.fn();
        const { result } = renderHook(() =>
          useEditingKeyboardShortcuts({ onSave, onCancel })
        );

        const event = {
          key: 'Enter',
          ctrlKey: false,
          metaKey: false,
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent<HTMLTextAreaElement>;

        result.current.handleTextareaKeyDown(event);

        expect(event.preventDefault).not.toHaveBeenCalled();
        expect(onSave).not.toHaveBeenCalled();
      });
    });

    describe('with enter save shortcut', () => {
      it('should call onSave when Enter is pressed without shift', () => {
        const onSave = vi.fn();
        const onCancel = vi.fn();
        const { result } = renderHook(() =>
          useEditingKeyboardShortcuts({ onSave, onCancel, saveShortcut: 'enter' })
        );

        const event = {
          key: 'Enter',
          shiftKey: false,
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent<HTMLTextAreaElement>;

        result.current.handleTextareaKeyDown(event);

        expect(event.preventDefault).toHaveBeenCalled();
        expect(onSave).toHaveBeenCalled();
      });

      it('should NOT call onSave when Shift+Enter is pressed', () => {
        const onSave = vi.fn();
        const onCancel = vi.fn();
        const { result } = renderHook(() =>
          useEditingKeyboardShortcuts({ onSave, onCancel, saveShortcut: 'enter' })
        );

        const event = {
          key: 'Enter',
          shiftKey: true,
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent<HTMLTextAreaElement>;

        result.current.handleTextareaKeyDown(event);

        expect(event.preventDefault).not.toHaveBeenCalled();
        expect(onSave).not.toHaveBeenCalled();
      });
    });

    it('should call onCancel when Escape is pressed', () => {
      const onSave = vi.fn();
      const onCancel = vi.fn();
      const { result } = renderHook(() =>
        useEditingKeyboardShortcuts({ onSave, onCancel })
      );

      const event = {
        key: 'Escape',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent<HTMLTextAreaElement>;

      result.current.handleTextareaKeyDown(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(onCancel).toHaveBeenCalled();
      expect(onSave).not.toHaveBeenCalled();
    });

    it('should not call any handler for other keys', () => {
      const onSave = vi.fn();
      const onCancel = vi.fn();
      const { result } = renderHook(() =>
        useEditingKeyboardShortcuts({ onSave, onCancel })
      );

      const event = {
        key: 'a',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent<HTMLTextAreaElement>;

      result.current.handleTextareaKeyDown(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(onSave).not.toHaveBeenCalled();
      expect(onCancel).not.toHaveBeenCalled();
    });
  });

  describe('handleSelectKeyDown', () => {
    it('should call onSave when Enter is pressed', () => {
      const onSave = vi.fn();
      const onCancel = vi.fn();
      const { result } = renderHook(() =>
        useEditingKeyboardShortcuts({ onSave, onCancel })
      );

      const event = {
        key: 'Enter',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent<HTMLSelectElement>;

      result.current.handleSelectKeyDown(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(onSave).toHaveBeenCalled();
      expect(onCancel).not.toHaveBeenCalled();
    });

    it('should call onCancel when Escape is pressed', () => {
      const onSave = vi.fn();
      const onCancel = vi.fn();
      const { result } = renderHook(() =>
        useEditingKeyboardShortcuts({ onSave, onCancel })
      );

      const event = {
        key: 'Escape',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent<HTMLSelectElement>;

      result.current.handleSelectKeyDown(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(onCancel).toHaveBeenCalled();
      expect(onSave).not.toHaveBeenCalled();
    });

    it('should not call any handler for other keys', () => {
      const onSave = vi.fn();
      const onCancel = vi.fn();
      const { result } = renderHook(() =>
        useEditingKeyboardShortcuts({ onSave, onCancel })
      );

      const event = {
        key: 'a',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent<HTMLSelectElement>;

      result.current.handleSelectKeyDown(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(onSave).not.toHaveBeenCalled();
      expect(onCancel).not.toHaveBeenCalled();
    });
  });

  describe('callback stability', () => {
    it('should return stable handlers when dependencies do not change', () => {
      const onSave = vi.fn();
      const onCancel = vi.fn();
      const { result, rerender } = renderHook(() =>
        useEditingKeyboardShortcuts({ onSave, onCancel })
      );

      const firstTextareaHandler = result.current.handleTextareaKeyDown;
      const firstSelectHandler = result.current.handleSelectKeyDown;

      rerender();

      expect(result.current.handleTextareaKeyDown).toBe(firstTextareaHandler);
      expect(result.current.handleSelectKeyDown).toBe(firstSelectHandler);
    });
  });
});
