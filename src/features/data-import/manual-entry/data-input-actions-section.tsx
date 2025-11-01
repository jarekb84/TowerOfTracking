import { Button } from '@/components/ui';
import { Upload, FileText } from 'lucide-react';

interface DataInputActionsSectionProps {
  onPaste: () => void;
  onImportFile: () => void;
}

export function DataInputActionsSection({
  onPaste,
  onImportFile
}: DataInputActionsSectionProps) {
  return (
    <div className="flex gap-2">
      <Button 
        variant="outline" 
        onClick={onPaste}
        className="flex-1 gap-2 h-10 px-4 hover:bg-accent/50 transition-all duration-200"
      >
        <Upload className="h-4 w-4" />
        <span>Paste from Clipboard</span>
      </Button>
      <Button 
        variant="outline" 
        onClick={onImportFile}
        className="flex-1 gap-2 h-10 px-4 hover:bg-accent/50 transition-all duration-200"
      >
        <FileText className="h-4 w-4" />
        <span>Import from File</span>
      </Button>
    </div>
  );
}