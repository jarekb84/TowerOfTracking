import { InfoBox } from '@/components/ui';
import { Link } from '@tanstack/react-router';
import type { ParsedGameRun } from '@/shared/types/game-run.types';
import { useFormatMismatch } from './use-format-mismatch';

interface FormatMismatchWarningProps {
  parsedRuns: ParsedGameRun[] | undefined;
  className?: string;
  /** Called when the user clicks the settings link - useful for closing modals */
  onSettingsClick?: () => void;
}

/**
 * Displays a warning when the detected data format doesn't match user settings.
 * Only shows when a mismatch is detected - no indicator when formats match.
 */
export function FormatMismatchWarning({ parsedRuns, className, onSettingsClick }: FormatMismatchWarningProps) {
  const mismatch = useFormatMismatch(parsedRuns);

  // Only show when there's a mismatch
  if (!mismatch || !mismatch.hasMismatch) {
    return null;
  }

  return (
    <div className={className}>
      <InfoBox variant="warning" title="Format Mismatch Detected">
      <div className="space-y-2">
        {mismatch.numberMismatch && mismatch.detectedNumberDescription && (
          <p>
            Your pasted data appears to use a different number format:{' '}
            <span className="font-mono font-medium">
              {mismatch.detectedNumberDescription}
            </span>
          </p>
        )}
        {mismatch.dateMismatch && mismatch.detectedDateDescription && (
          <p>
            Your pasted data appears to use a different date format:{' '}
            <span className="font-mono font-medium">
              {mismatch.detectedDateDescription}
            </span>
          </p>
        )}
        <p>
          You can update your format settings in the{' '}
          <Link
            to="/settings/locale"
            onClick={onSettingsClick}
            className="text-orange-200 underline decoration-orange-400/50 hover:decoration-orange-300 hover:text-orange-100 font-medium transition-colors"
          >
            Regional Format settings
          </Link>
          .
        </p>
      </div>
      </InfoBox>
    </div>
  );
}
