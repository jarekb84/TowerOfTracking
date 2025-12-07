import { InfoBox } from '@/components/ui/info-box';
import type { BattleDateValidationError } from '@/shared/formatting/date-validation.types';

interface SingleEntryDateWarningProps {
  error: BattleDateValidationError;
  className?: string;
}

/**
 * Displays a date validation warning for single-entry manual import.
 * Uses InfoBox with warning variant for consistent styling.
 */
export function SingleEntryDateWarning({
  error,
  className,
}: SingleEntryDateWarningProps) {
  return (
    <InfoBox
      variant="warning"
      title="Invalid Battle Date"
      className={className}
    >
      <div className="space-y-1.5">
        <p>
          <span className="font-medium">Value:</span>{' '}
          <code className="font-mono text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded">
            {error.rawValue ? `"${error.rawValue}"` : '(empty)'}
          </code>
        </p>
        <p>
          <span className="font-medium">Issue:</span> {error.message}
        </p>
        {error.suggestion && (
          <p>
            <span className="font-medium">Suggestion:</span> {error.suggestion}
          </p>
        )}
        <p className="mt-2 pt-2 border-t border-orange-500/20 text-orange-200">
          The date/time you selected below will be used instead.
        </p>
      </div>
    </InfoBox>
  );
}
