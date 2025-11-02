import { Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';

interface EditActionButtonsProps {
  onSave: () => void;
  onCancel: () => void;
  saveLabel?: string;
  cancelLabel?: string;
  size?: 'sm' | 'default' | 'lg';
  fullWidthOnMobile?: boolean;
  disabled?: boolean;
}

export function EditActionButtons({
  onSave,
  onCancel,
  saveLabel = 'Save',
  cancelLabel = 'Cancel',
  size = 'default',
  fullWidthOnMobile = false,
  disabled = false,
}: EditActionButtonsProps) {
  return (
    <ButtonGroup spacing="tight" wrap={false}>
      <Button
        onClick={onSave}
        variant="default"
        size={size}
        fullWidthOnMobile={fullWidthOnMobile}
        className="bg-accent text-accent-foreground hover:bg-accent/90"
        disabled={disabled}
      >
        {disabled ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Check className="h-4 w-4" />
        )}
        {disabled ? 'Saving...' : saveLabel}
      </Button>
      <Button
        onClick={onCancel}
        variant="outline"
        size={size}
        fullWidthOnMobile={fullWidthOnMobile}
        disabled={disabled}
      >
        <X className="h-4 w-4" />
        {cancelLabel}
      </Button>
    </ButtonGroup>
  );
}
