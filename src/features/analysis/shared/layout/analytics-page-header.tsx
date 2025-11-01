import { cn } from '@/shared/lib/utils'

interface AnalyticsPageHeaderProps {
  icon: string
  title: string
  description: string
  gradientFrom: string
  gradientTo: string
  className?: string
}

export function AnalyticsPageHeader({
  icon,
  title,
  description,
  gradientFrom,
  gradientTo,
  className
}: AnalyticsPageHeaderProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="relative">
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r bg-clip-text text-transparent" style={{
          backgroundImage: `linear-gradient(to right, ${gradientFrom}, ${gradientTo})`
        }}>
          {icon} {title}
        </h1>
        <div
          className="absolute -inset-1 blur-lg -z-10 rounded-lg"
          style={{
            backgroundImage: `linear-gradient(to right, ${gradientFrom}33, ${gradientTo}33)`
          }}
        />
      </div>
      <p className="text-muted-foreground text-base sm:text-lg">
        {description}
      </p>
    </div>
  )
}
