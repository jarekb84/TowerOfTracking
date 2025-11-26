import { Button } from '@/components/ui';
import { cn } from '@/shared/lib/utils';
import { X, Upload } from 'lucide-react';

interface StickyActionFooterProps {
  visible: boolean;
  onClear: () => void;
  onImport: () => void;
  canImport: boolean;
  importButtonText: string;
  className?: string;
}

/**
 * Sticky footer for action buttons that remains fixed at the bottom of the viewport.
 * Used in full-page import context where content may exceed viewport height.
 */
export function StickyActionFooter({
  visible,
  onClear,
  onImport,
  canImport,
  importButtonText,
  className
}: StickyActionFooterProps) {
  if (!visible) return null;

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40',
        'border-t border-slate-700/50 bg-slate-900/95 backdrop-blur-md',
        'px-4 py-3 sm:px-6 sm:py-4',
        'shadow-[0_-4px_20px_rgba(0,0,0,0.3)]',
        'animate-in slide-in-from-bottom-4 duration-200',
        className
      )}
    >
      <div className="max-w-7xl mx-auto flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end items-stretch sm:items-center">
        <Button
          variant="outline"
          onClick={onClear}
          size="default"
          className="w-full sm:w-auto"
        >
          <X className="h-4 w-4" />
          Clear
        </Button>
        <Button
          onClick={onImport}
          disabled={!canImport}
          size="default"
          className="w-full sm:w-auto"
        >
          <Upload className="h-4 w-4" />
          {importButtonText}
        </Button>
      </div>
    </div>
  );
}
