// src/components/feedback/ErrorPanel.tsx
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface ErrorPanelProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorPanel({
  title = 'Terjadi Kesalahan',
  message,
  onRetry,
  className = '',
}: ErrorPanelProps) {
  return (
    <div
      role="alert"
      className={`rounded-panel border border-coral-700 bg-coral-50 p-4 text-coral-700 ${className}`}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-sm">{title}</h3>
          <p className="text-sm mt-1 text-ink-900">{message}</p>
          {onRetry && (
            <div className="mt-3">
              <Button
                variant="danger"
                size="sm"
                onClick={onRetry}
                className="gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Coba lagi
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

