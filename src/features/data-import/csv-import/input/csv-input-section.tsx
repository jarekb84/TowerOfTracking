import { Button, Textarea } from '../../../../components/ui';
import { Upload, FileText } from 'lucide-react';

interface CsvInputSectionProps {
  inputData: string;
  onInputChange: (value: string) => void;
  onPaste: () => void;
  onFileImport: () => void;
}

export function CsvInputSection({
  inputData,
  onInputChange,
  onPaste,
  onFileImport
}: CsvInputSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3 items-center">
        <Button variant="outline" onClick={onPaste} className="gap-2">
          <Upload className="h-4 w-4" />
          Paste from Clipboard
        </Button>
        <Button variant="outline" onClick={onFileImport} className="gap-2">
          <FileText className="h-4 w-4" />
          Import from File
        </Button>
      </div>

      <Textarea
        placeholder="Paste your CSV data here...
Example format (any column names work):
Date,Time,Tier,Wave,Real Time,Coins Earned,Cells Earned,Killed By,Notes
2024-01-15,14:30,10,5881,7h 46m 6s,1.13T,45.2K,Wall,Good run
2024-01-16,16:20,11,6200,8h 12m 30s,1.45T,52.1K,Elite,Another run

Column headers will be automatically converted to camelCase and matched against supported fields."
        value={inputData}
        onChange={(e) => onInputChange(e.target.value)}
        className="font-mono text-sm h-48 resize-none"
      />
    </div>
  );
}
