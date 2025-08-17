import { useCallback } from 'react';

interface UseFileImportOptions {
  acceptedTypes?: string;
  onFileContent: (content: string) => void;
  onError?: (error: Error) => void;
}

export function useFileImport({ 
  acceptedTypes = '.txt,.tsv,.csv', 
  onFileContent, 
  onError 
}: UseFileImportOptions) {
  const importFile = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = acceptedTypes;
    
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
          try {
            const text = e.target?.result as string;
            onFileContent(text);
          } catch (error) {
            onError?.(error instanceof Error ? error : new Error('Failed to read file'));
          }
        };
        
        reader.onerror = () => {
          onError?.(new Error('Failed to read file'));
        };
        
        reader.readAsText(file);
      }
    };
    
    input.click();
  }, [acceptedTypes, onFileContent, onError]);

  return { importFile };
}