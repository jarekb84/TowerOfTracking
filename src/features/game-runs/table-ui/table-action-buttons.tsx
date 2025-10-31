import { Button } from '../../../components/ui';
import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react';

interface ExpandButtonProps {
  isExpanded: boolean;
  onToggle: () => void;
  size?: 'sm' | 'compact';
}

export function ExpandButton({ isExpanded, onToggle, size = 'sm' }: ExpandButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggle();
  };

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={handleClick}
      className="p-1 text-muted-foreground hover:bg-accent/40 hover:text-foreground transition-all duration-200 hover:scale-105"
    >
      {isExpanded ? (
        <ChevronDown className="h-4 w-4 transition-transform duration-200" />
      ) : (
        <ChevronRight className="h-4 w-4 transition-transform duration-200" />
      )}
    </Button>
  );
}

interface DeleteButtonProps {
  onDelete: () => void;
  size?: 'sm' | 'compact';
}

export function DeleteButton({ onDelete, size = 'sm' }: DeleteButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete();
  };

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={handleClick}
      className="p-1 text-muted-foreground hover:bg-destructive/60 hover:text-destructive-foreground transition-colors duration-200"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}