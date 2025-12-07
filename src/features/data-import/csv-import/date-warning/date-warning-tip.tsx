import { Lightbulb } from 'lucide-react';

/**
 * Tip section explaining how users can make unfixable rows fixable
 * by renaming their date columns to _Date and _Time.
 */
export function DateWarningTip() {
  return (
    <div className="flex items-start gap-2.5 text-sm text-muted-foreground bg-muted/20 rounded-lg p-3 border-l-2 border-muted-foreground/30">
      <Lightbulb className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground/70" />
      <p>
        <strong className="text-foreground/80">Tip:</strong> If your source file has separate date and time columns
        (e.g., &ldquo;yyyy-MM-dd&rdquo; and &ldquo;HH:mm:ss&rdquo;), rename them to &ldquo;_Date&rdquo; and &ldquo;_Time&rdquo;
        and re-import to enable auto-fix.
      </p>
    </div>
  );
}
