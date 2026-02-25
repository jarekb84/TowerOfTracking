/**
 * Week Navigator Component
 *
 * Horizontal navigation bar for browsing between available weeks.
 * Displays prev/next arrows, the current week label, and a "Latest" shortcut.
 *
 * Thin presentation shell — all navigation logic lives in the orchestration hook.
 */

interface WeekNavigatorProps {
  weekLabel: string
  canGoPrev: boolean
  canGoNext: boolean
  onPrev: () => void
  onNext: () => void
  onGoToLatest: () => void
}

const NAV_BUTTON_BASE =
  'rounded-md border border-slate-600 bg-slate-700/50 px-2.5 py-1.5 text-sm text-slate-300 transition-colors hover:bg-slate-600/60 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-slate-700/50 disabled:hover:text-slate-300 sm:px-3'

export function WeekNavigator({
  weekLabel,
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
  onGoToLatest,
}: WeekNavigatorProps) {
  return (
    <nav
      className="flex items-center justify-center gap-2 sm:gap-3"
      aria-label="Week navigation"
    >
      <button
        type="button"
        onClick={onPrev}
        disabled={!canGoPrev}
        aria-label="Previous week"
        className={NAV_BUTTON_BASE}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <span className="min-w-[8rem] text-center text-xs font-medium text-slate-200 sm:min-w-[10rem] sm:text-sm">
        {weekLabel}
      </span>

      <button
        type="button"
        onClick={onNext}
        disabled={!canGoNext}
        aria-label="Next week"
        className={NAV_BUTTON_BASE}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <button
        type="button"
        onClick={onGoToLatest}
        disabled={!canGoNext}
        aria-label="Jump to latest week"
        className="ml-0.5 rounded-md border border-amber-600/50 bg-amber-500/10 px-2.5 py-1.5 text-xs text-amber-400 transition-colors hover:bg-amber-500/20 hover:text-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-amber-500/10 disabled:hover:text-amber-400 sm:ml-1 sm:px-3 sm:text-sm"
      >
        Latest
      </button>
    </nav>
  )
}
