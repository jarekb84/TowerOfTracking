/**
 * CollapsibleCard Component
 *
 * A reusable card component that can be collapsed to show only
 * a header with summary information, or expanded to show full content.
 */

import { cn } from '@/shared/lib/utils';

interface CollapsibleCardProps {
  /** Card title displayed in the header */
  title: string;
  /** Summary text shown in collapsed state (optional) */
  summary?: string;
  /** Additional content to display in the header (optional) */
  headerContent?: React.ReactNode;
  /** Whether the card is expanded */
  isExpanded: boolean;
  /** Callback when expand/collapse is toggled */
  onToggle: () => void;
  /** Card content (only visible when expanded) */
  children: React.ReactNode;
  /** Additional className for the card container */
  className?: string;
}

export function CollapsibleCard({
  title,
  summary,
  headerContent,
  isExpanded,
  onToggle,
  children,
  className,
}: CollapsibleCardProps) {
  return (
    <div
      className={cn(
        'bg-slate-800/30 rounded-lg border border-slate-700/50',
        'transition-all duration-300',
        className
      )}
    >
      {/* Header Row */}
      <div
        className={cn(
          'flex items-center gap-2 px-4 py-3',
          'transition-colors duration-200',
          // Rounded corners based on expand state
          isExpanded ? 'rounded-t-lg' : 'rounded-lg'
        )}
      >
        {/* Clickable Title Section */}
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            'flex items-center gap-2 min-w-0 flex-1',
            'text-left transition-colors duration-200',
            'hover:bg-slate-700/20 -mx-2 px-2 py-1 rounded',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50'
          )}
          aria-expanded={isExpanded}
        >
          {/* Chevron Icon */}
          <ChevronIcon isExpanded={isExpanded} />

          {/* Title */}
          <span className="text-sm font-semibold text-slate-200 shrink-0">
            {title}
          </span>

          {/* Summary (shown when collapsed or expanded, right-aligned) */}
          {summary && (
            <span className="ml-auto text-xs text-slate-400 truncate">
              {summary}
            </span>
          )}
        </button>

        {/* Additional Header Content (doesn't trigger toggle) */}
        {headerContent && (
          <div
            className="shrink-0"
            role="presentation"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {headerContent}
          </div>
        )}
      </div>

      {/* Expandable Content */}
      <div
        className={cn(
          'grid transition-all duration-300 ease-in-out',
          isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        )}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

interface ChevronIconProps {
  isExpanded: boolean;
}

function ChevronIcon({ isExpanded }: ChevronIconProps) {
  return (
    <svg
      className={cn(
        'w-4 h-4 text-slate-400 shrink-0',
        'transition-transform duration-300',
        'motion-reduce:transition-none',
        isExpanded ? 'rotate-90' : 'rotate-0'
      )}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
