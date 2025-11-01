import { RunTypeValue } from '../types/game-run.types';
import { getRunTypeColor } from '../run-types/run-type-display';

interface RunTypeIndicatorProps {
  runType: RunTypeValue;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'w-2 h-2',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
} as const;

/**
 * Visual indicator dot for run types
 * Shows a colored circle matching the run type's theme color
 */
export function RunTypeIndicator({ runType, size = 'md', className = '' }: RunTypeIndicatorProps) {
  return (
    <div
      className={`${SIZE_CLASSES[size]} rounded-full shrink-0 ${className}`}
      style={{ backgroundColor: getRunTypeColor(runType) }}
      aria-hidden="true"
    />
  );
}
