import { Input, Select } from '@/components/ui';
import type { CsvDelimiter } from '../types';

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
      <Select
        value={selectedDelimiter}
        onChange={(e) => onDelimiterChange(e.target.value as CsvDelimiter)}
        width="md"
        aria-label="Select delimiter"
      >
        <option value="tab">Tab</option>
        <option value="comma">Comma</option>
        <option value="semicolon">Semicolon</option>
        <option value="custom">Custom</option>
      </Select>

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
