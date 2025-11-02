import { Textarea } from '@/components/ui/textarea';
import { FormField, FormLabel } from '@/components/ui';

interface NotesFieldProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  textareaClassName?: string;
  id?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

/**
 * Reusable notes field component
 * Used in both Add Game Run modal and Edit User Fields
 */
export function NotesField({
  value,
  onChange,
  label = 'Notes',
  placeholder = 'Add notes for this run...',
  required = false,
  className,
  textareaClassName = 'min-h-[100px] resize-y',
  id = 'notes-field',
  onKeyDown,
}: NotesFieldProps) {
  return (
    <FormField className={className}>
      <FormLabel htmlFor={id} required={required}>
        {label}
      </FormLabel>
      <Textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        className={textareaClassName}
        placeholder={placeholder}
      />
    </FormField>
  );
}
