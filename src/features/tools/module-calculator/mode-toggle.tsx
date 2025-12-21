/**
 * Mode Toggle
 *
 * Toggle button group for switching between calculator modes.
 */

export type CalculatorMode = 'monteCarlo' | 'manual';

interface ModeOption {
  value: CalculatorMode;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const MODE_OPTIONS: ModeOption[] = [
  {
    value: 'monteCarlo',
    label: 'Monte Carlo',
    icon: <SimulationIcon />,
    description: 'Run statistical simulation for cost estimates',
  },
  {
    value: 'manual',
    label: 'Practice',
    icon: <PracticeIcon />,
    description: 'Practice rolling manually',
  },
];

interface ModeToggleProps {
  mode: CalculatorMode;
  onModeChange: (mode: CalculatorMode) => void;
}

export function ModeToggle({ mode, onModeChange }: ModeToggleProps) {
  return (
    <div
      className="inline-flex items-center bg-slate-800/50 rounded-lg p-1 border border-slate-700/50 w-full"
      role="group"
      aria-label="Calculator mode"
    >
      {MODE_OPTIONS.map((modeOption, index) => (
        <ModeButton
          key={modeOption.value}
          option={modeOption}
          isSelected={mode === modeOption.value}
          isFirst={index === 0}
          isLast={index === MODE_OPTIONS.length - 1}
          onSelect={onModeChange}
        />
      ))}
    </div>
  );
}

interface ModeButtonProps {
  option: ModeOption;
  isSelected: boolean;
  isFirst: boolean;
  isLast: boolean;
  onSelect: (mode: CalculatorMode) => void;
}

function ModeButton({
  option,
  isSelected,
  isFirst,
  isLast,
  onSelect,
}: ModeButtonProps) {
  const className = buildModeButtonClassName(isSelected, isFirst, isLast);

  return (
    <button
      onClick={() => onSelect(option.value)}
      aria-pressed={isSelected}
      title={option.description}
      className={className}
    >
      <span className="opacity-70">{option.icon}</span>
      {option.label}
    </button>
  );
}

function buildModeButtonClassName(isSelected: boolean, isFirst: boolean, isLast: boolean): string {
  const base = 'flex-1 relative flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50 focus-visible:z-10';
  const rounded = `${isFirst ? 'rounded-l-md' : ''} ${isLast ? 'rounded-r-md' : ''}`;

  if (isSelected) {
    return `${base} ${rounded} bg-orange-500/15 text-orange-400 border border-orange-500/40 shadow-sm`;
  }
  return `${base} ${rounded} text-slate-400 hover:text-slate-300 hover:bg-slate-700/40 border border-transparent`;
}

function SimulationIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3v18h18" />
      <path d="M7 16l4-8 4 5 5-10" />
    </svg>
  );
}

function PracticeIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1" fill="currentColor" />
      <circle cx="15.5" cy="15.5" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}
