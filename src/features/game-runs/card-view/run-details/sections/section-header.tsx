/**
 * Section Header Component
 *
 * Consistent header styling for run details sections.
 */

interface SectionHeaderProps {
  /** Main section title */
  title: string
  /** Optional descriptive subtitle */
  subtitle?: string
}

export function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  return (
    <div className="border-b border-border/40 pb-2">
      <h5 className="font-semibold text-base sm:text-lg text-primary">
        {title}
      </h5>
      {subtitle && (
        <p className="text-xs sm:text-sm text-muted-foreground/70 mt-0.5">
          {subtitle}
        </p>
      )}
    </div>
  )
}
