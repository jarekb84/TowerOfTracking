import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEditableField } from './use-editable-field';

describe('useEditableField', () => {
  it('should initialize with initial value and not editing', () => {
    const onSave = vi.fn();
    const { result } = renderHook(() =>
      useEditableField({ initialValue: 'initial text', onSave })
    );

    expect(result.current.value).toBe('initial text');
    expect(result.current.isEditing).toBe(false);
  });

  it('should start editing mode and reset value to initial', () => {
    const onSave = vi.fn();
    const { result } = renderHook(() =>
      useEditableField({ initialValue: 'initial text', onSave })
    );

    act(() => {
      result.current.handleChange('changed text');
    });

    expect(result.current.value).toBe('changed text');

    act(() => {
      result.current.startEditing();
    });

    expect(result.current.isEditing).toBe(true);
    expect(result.current.value).toBe('initial text');
  });

  it('should update value when handleChange is called', () => {
    const onSave = vi.fn();
    const { result } = renderHook(() =>
      useEditableField({ initialValue: 'initial text', onSave })
    );

    act(() => {
      result.current.startEditing();
    });

    act(() => {
      result.current.handleChange('new value');
    });

    expect(result.current.value).toBe('new value');
    expect(result.current.isEditing).toBe(true);
  });

  it('should save changes and exit editing mode', () => {
    const onSave = vi.fn();
    const { result } = renderHook(() =>
      useEditableField({ initialValue: 'initial text', onSave })
    );

    act(() => {
      result.current.startEditing();
    });

    act(() => {
      result.current.handleChange('updated text');
    });

    act(() => {
      result.current.saveEdit();
    });

    expect(onSave).toHaveBeenCalledWith('updated text');
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(result.current.isEditing).toBe(false);
  });

  it('should cancel editing and revert to initial value', () => {
    const onSave = vi.fn();
    const { result } = renderHook(() =>
      useEditableField({ initialValue: 'initial text', onSave })
    );

    act(() => {
      result.current.startEditing();
    });

    act(() => {
      result.current.handleChange('discarded changes');
    });

    act(() => {
      result.current.cancelEditing();
    });

    expect(result.current.value).toBe('initial text');
    expect(result.current.isEditing).toBe(false);
    expect(onSave).not.toHaveBeenCalled();
  });

  it('should handle empty initial value', () => {
    const onSave = vi.fn();
    const { result } = renderHook(() =>
      useEditableField({ initialValue: '', onSave })
    );

    expect(result.current.value).toBe('');

    act(() => {
      result.current.startEditing();
    });

    act(() => {
      result.current.handleChange('new content');
    });

    act(() => {
      result.current.saveEdit();
    });

    expect(onSave).toHaveBeenCalledWith('new content');
  });

  it('should handle saving empty value', () => {
    const onSave = vi.fn();
    const { result } = renderHook(() =>
      useEditableField({ initialValue: 'some text', onSave })
    );

    act(() => {
      result.current.startEditing();
    });

    act(() => {
      result.current.handleChange('');
    });

    act(() => {
      result.current.saveEdit();
    });

    expect(onSave).toHaveBeenCalledWith('');
    expect(result.current.isEditing).toBe(false);
  });

  it('should allow multiple edit sessions', () => {
    const onSave = vi.fn();
    const { result } = renderHook(() =>
      useEditableField({ initialValue: 'v1', onSave })
    );

    // First edit
    act(() => {
      result.current.startEditing();
    });
    act(() => {
      result.current.handleChange('v2');
    });
    act(() => {
      result.current.saveEdit();
    });

    expect(onSave).toHaveBeenCalledWith('v2');

    // Second edit
    act(() => {
      result.current.startEditing();
    });
    act(() => {
      result.current.handleChange('v3');
    });
    act(() => {
      result.current.saveEdit();
    });

    expect(onSave).toHaveBeenCalledWith('v3');
    expect(onSave).toHaveBeenCalledTimes(2);
  });
});
