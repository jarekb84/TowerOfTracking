import { useState } from 'react';

export interface UseEditableFieldOptions {
  initialValue: string;
  onSave: (value: string) => void;
}

export interface UseEditableFieldReturn {
  value: string;
  isEditing: boolean;
  startEditing: () => void;
  cancelEditing: () => void;
  handleChange: (newValue: string) => void;
  saveEdit: () => void;
}

export function useEditableField({ initialValue, onSave }: UseEditableFieldOptions): UseEditableFieldReturn {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);

  const startEditing = () => {
    setValue(initialValue);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setValue(initialValue);
    setIsEditing(false);
  };

  const handleChange = (newValue: string) => {
    setValue(newValue);
  };

  const saveEdit = () => {
    onSave(value);
    setIsEditing(false);
  };

  return {
    value,
    isEditing,
    startEditing,
    cancelEditing,
    handleChange,
    saveEdit,
  };
}
