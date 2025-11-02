import { Pencil } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface EditIconButtonProps {
  onClick: () => void;
  label?: string;
  showLabel?: boolean;
  className?: string;
  iconClassName?: string;
}

export function EditIconButton({
  onClick,
  label = 'Edit',
  showLabel = true,
  className,
  iconClassName,
}: EditIconButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 text-xs text-muted-foreground',
        'hover:text-accent transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 rounded px-1.5 py-1',
        className
      )}
      aria-label={label}
    >
      <Pencil className={cn('h-3.5 w-3.5', iconClassName)} />
      {showLabel && <span>{label}</span>}
    </button>
  );
}
