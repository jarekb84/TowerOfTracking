/**
 * Empty state displayed when there are no game runs to show.
 * Uses div-based layout for both desktop (virtualized) and mobile (cards).
 */
export function TableEmptyState() {
  return (
    <div className="text-center py-8 text-muted-foreground">
      No runs found. Add your first game run to get started!
    </div>
  );
}