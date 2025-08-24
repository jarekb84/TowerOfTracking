interface FarmingOnlyIndicatorProps {
  className?: string
}

export function FarmingOnlyIndicator({ className = '' }: FarmingOnlyIndicatorProps) {
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 ${className}`}>
      <div className="w-2 h-2 rounded-full bg-emerald-400" />
      <span className="text-sm font-medium text-emerald-300">Farming Runs Only</span>
    </div>
  )
}