import { Input } from '../../../../components/ui';
import type { CsvDelimiter } from '../../../data-tracking/types/game-run.types';

interface DelimiterControlsProps {
  selectedDelimiter: CsvDelimiter;
  customDelimiter: string;
  onDelimiterChange: (delimiter: CsvDelimiter) => void;
  onCustomDelimiterChange: (value: string) => void;
}

export function DelimiterControls({
  selectedDelimiter,
  customDelimiter,
  onDelimiterChange,
  onCustomDelimiterChange
}: DelimiterControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Delimiter:</span>
      <select
        value={selectedDelimiter}
        onChange={(e) => onDelimiterChange(e.target.value as CsvDelimiter)}
        className="w-32 px-2 py-1 border rounded text-sm bg-background"
      >
        <option value="tab">Tab</option>
        <option value="comma">Comma</option>
        <option value="semicolon">Semicolon</option>
        <option value="custom">Custom</option>
      </select>

      {selectedDelimiter === 'custom' && (
        <Input
          placeholder="Enter delimiter"
          value={customDelimiter}
          onChange={(e) => onCustomDelimiterChange(e.target.value)}
          className="w-20"
          maxLength={1}
        />
      )}
    </div>
  );
}
