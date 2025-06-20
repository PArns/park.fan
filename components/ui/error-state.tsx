import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  showHomeButton?: boolean;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  showHomeButton = false,
}: ErrorStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="w-full max-w-md">
        <CardContent className="text-center p-8">
          <div className="flex justify-center mb-4">
            <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
          </div>

          <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>

          <p className="text-muted-foreground text-sm mb-6">{message}</p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {onRetry && (
              <Button onClick={onRetry} className="inline-flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
            )}

            {showHomeButton && (
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
              >
                <Home className="w-4 h-4" />
                Go Home
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
