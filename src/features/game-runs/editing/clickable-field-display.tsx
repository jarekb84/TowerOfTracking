import { cn } from '@/shared/lib/utils';

interface ClickableFieldDisplayProps {
  /** Label shown on the left side */
  label: string;
  /** Click handler to start editing */
  onClick: () => void;
  /** Content to display on the right side */
  children: React.ReactNode;
  /** Additional className for the container */
  className?: string;
  /** Layout variant */
  variant?: 'inline' | 'stacked';
}

/**
 * Reusable clickable field display component for read-only views
 * Used in EditableUserFields for Run Type, Rank, and Notes displays
 * Provides consistent hover states and keyboard accessibility
 */
export function ClickableFieldDisplay({
  label,
  onClick,
  children,
  className,
  variant = 'inline',
}: ClickableFieldDisplayProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  if (variant === 'stacked') {
    return (
      <div
        className={cn(
          'cursor-pointer p-3 rounded-md',
          'hover:bg-accent/5 hover:border-accent/20 border border-transparent',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50',
          'transition-colors',
          className
        )}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label={`Click to edit ${label.toLowerCase()}`}
      >
        <div className="mb-2">
          <span className="font-mono text-sm text-muted-foreground">{label}</span>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-2 rounded-md cursor-pointer',
        'hover:bg-accent/5 hover:border-accent/20 border border-transparent',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50',
        'transition-colors',
        className
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={`Click to edit ${label.toLowerCase()}`}
    >
      <span className="font-mono text-sm text-muted-foreground min-w-[80px]">
        {label}
      </span>
      {children}
    </div>
  );
}

interface FieldValueProps {
  children: React.ReactNode;
  /** Display as accent color (for values) or muted (for empty states) */
  variant?: 'value' | 'empty';
}

/**
 * Styled field value display, used within ClickableFieldDisplay
 */
export function FieldValue({ children, variant = 'value' }: FieldValueProps) {
  if (variant === 'empty') {
    return (
      <span className="text-muted-foreground/50 italic text-sm font-normal">
        {children}
      </span>
    );
  }

  return (
    <span className="font-mono text-sm text-accent font-medium">
      {children}
    </span>
  );
}
