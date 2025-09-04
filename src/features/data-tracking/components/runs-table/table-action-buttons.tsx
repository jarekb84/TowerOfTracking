import { Button } from '../../../../components/ui';
import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react';

interface ExpandButtonProps {
  isExpanded: boolean;
  onToggle: () => void;
  size?: 'sm' | 'compact';
}

export function ExpandButton({ isExpanded, onToggle, size = 'sm' }: ExpandButtonProps) {
  return (
    <Button
      variant="ghost"
      size={size}
      onClick={onToggle}
      className="p-1 text-muted-foreground hover:bg-accent/40 hover:text-foreground transition-colors duration-200"
    >
      {isExpanded ? (
        <ChevronDown className="h-4 w-4" />
      ) : (
        <ChevronRight className="h-4 w-4" />
      )}
    </Button>
  );
}

interface DeleteButtonProps {
  onDelete: () => void;
  size?: 'sm' | 'compact';
}

export function DeleteButton({ onDelete, size = 'sm' }: DeleteButtonProps) {
  return (
    <Button
      variant="ghost"
      size={size}
      onClick={onDelete}
      className="p-1 text-muted-foreground hover:bg-destructive/60 hover:text-destructive-foreground transition-colors duration-200"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}