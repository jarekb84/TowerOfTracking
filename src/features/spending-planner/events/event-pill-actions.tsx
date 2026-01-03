/**
 * Event Pill Action Buttons
 *
 * Edit, clone, and remove action buttons for event pills.
 */

interface EventPillActionsProps {
  eventName: string
  onEdit: (e: React.MouseEvent) => void
  onClone: (e: React.MouseEvent) => void
  onRemove: (e: React.MouseEvent) => void
}

export function EventPillActions({
  eventName,
  onEdit,
  onClone,
  onRemove,
}: EventPillActionsProps) {
  return (
    <div className="flex flex-col justify-center gap-0.5 px-1 border-l border-slate-600/30">
      <button
        type="button"
        onClick={onEdit}
        className="p-1 text-slate-500 hover:text-blue-400 transition-colors"
        aria-label={`Edit ${eventName}`}
        title="Edit"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>
      <button
        type="button"
        onClick={onClone}
        className="p-1 text-slate-500 hover:text-green-400 transition-colors"
        aria-label={`Clone ${eventName}`}
        title="Clone"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="p-1 text-slate-500 hover:text-red-400 transition-colors"
        aria-label={`Remove ${eventName}`}
        title="Remove"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  )
}
