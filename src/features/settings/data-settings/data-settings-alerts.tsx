import { Button, Alert, AlertDescription } from '@/components/ui';
import { CheckCircle, XCircle, X } from 'lucide-react';

interface SuccessAlertProps {
  onDismiss: () => void;
}

export function SuccessAlert({ onDismiss }: SuccessAlertProps) {
  return (
    <Alert className="border-green-500/20 bg-green-500/5 transition-all duration-300 ease-in-out">
      <CheckCircle className="h-4 w-4 text-green-600" />
      <AlertDescription className="text-green-700 dark:text-green-300 pr-6">
        Successfully cleared all data from local storage.
      </AlertDescription>
      <Button
        variant="ghost"
        size="compact"
        onClick={onDismiss}
        className="absolute right-2 top-2 h-6 w-6 p-0 text-green-600 hover:text-green-800 hover:bg-green-500/10"
      >
        <X className="h-3 w-3" />
      </Button>
    </Alert>
  );
}

interface ErrorAlertProps {
  error: string;
  onDismiss: () => void;
}

export function ErrorAlert({ error, onDismiss }: ErrorAlertProps) {
  return (
    <Alert className="border-red-500/20 bg-red-500/5 transition-all duration-300 ease-in-out">
      <XCircle className="h-4 w-4 text-red-600" />
      <AlertDescription className="text-red-700 dark:text-red-300 pr-6">
        {error}
      </AlertDescription>
      <Button
        variant="ghost"
        size="compact"
        onClick={onDismiss}
        className="absolute right-2 top-2 h-6 w-6 p-0 text-red-600 hover:text-red-800 hover:bg-red-500/10"
      >
        <X className="h-3 w-3" />
      </Button>
    </Alert>
  );
}
