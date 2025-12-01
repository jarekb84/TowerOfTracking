import {
  Button,
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogFooter,
} from '@/components/ui';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  isDeleting: boolean;
  runsCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmationDialog({
  isOpen,
  isDeleting,
  runsCount,
  onConfirm,
  onCancel,
}: DeleteConfirmationDialogProps) {
  return (
    <ResponsiveDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isDeleting) onCancel();
      }}
    >
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader
          title="Confirm Permanent Deletion"
          description={`You are about to permanently delete ${runsCount} game runs. This action cannot be undone.`}
          className="border-b-destructive/20"
        />

        {/* Visual warning indicator */}
        <div className="px-4 py-5 sm:px-6 sm:py-6">
          <div className="flex items-start gap-4 rounded-lg border-2 border-dashed border-destructive/30 bg-destructive/5 p-4">
            <div className="rounded-full bg-destructive/10 p-2 shrink-0">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div className="space-y-1 min-w-0">
              <p className="text-sm font-medium text-destructive">
                This action is irreversible
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                All {runsCount} game runs will be permanently removed from local storage.
                Consider exporting your data first if you might need it later.
              </p>
            </div>
          </div>
        </div>

        <ResponsiveDialogFooter mobileLayout="equal">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isDeleting}
            className="h-10 hover:bg-muted/50 transition-all duration-200"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
            className="h-10 shadow-sm hover:shadow-md transition-all duration-200 disabled:shadow-none"
          >
            <Trash2 className={`h-4 w-4 ${isDeleting ? 'animate-pulse' : ''}`} />
            {isDeleting ? 'Deleting...' : 'Delete All Data'}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
