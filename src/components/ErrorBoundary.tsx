import React, { Component, ReactNode } from 'react';
import { AlertCircle, RefreshCw, RotateCcw, Copy } from 'lucide-react';
import { Button } from './ui/button';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { toast } from 'sonner';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
}

function generateErrorId(): string {
  return `ERR-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorId: null };
  }

  static getDerivedStateFromError(error: Error): State {
    const errorId = generateErrorId();
    return { hasError: true, error, errorId };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { errorId } = this.state;
    
    // Log completo a consola con ID
    console.error(`[${errorId}] ErrorBoundary caught:`, {
      error,
      errorInfo,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });

    // TODO: Send to Sentry or logging service
    // Sentry.captureException(error, {
    //   contexts: { react: { componentStack: errorInfo.componentStack } },
    //   tags: { errorId }
    // });
  }

  handleRetry = () => {
    console.log(`[${this.state.errorId}] User retrying...`);
    this.setState({ hasError: false, error: null, errorId: null });
    this.props.onReset?.();
  };

  handleReload = () => {
    console.log(`[${this.state.errorId}] User reloading page...`);
    window.location.reload();
  };

  handleCopyError = () => {
    const errorText = `Error ID: ${this.state.errorId}\nMessage: ${this.state.error?.message}\nStack: ${this.state.error?.stack}`;
    navigator.clipboard.writeText(errorText);
    toast.success('Error copiado al portapapeles');
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-screen p-4">
          <Alert variant="destructive" className="max-w-lg">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error inesperado</AlertTitle>
            <AlertDescription className="mt-2 space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-mono bg-destructive/10 p-2 rounded">
                  ID: {this.state.errorId}
                </p>
                <p className="text-sm">
                  Ha ocurrido un error. Puedes intentar continuar o recargar la página.
                </p>
              </div>

              {import.meta.env.DEV && this.state.error && (
                <details className="text-xs bg-muted p-3 rounded">
                  <summary className="cursor-pointer font-semibold mb-2">
                    Stack trace (DEV)
                  </summary>
                  <pre className="overflow-auto text-[10px] leading-tight">
                    {this.state.error.stack || this.state.error.message}
                  </pre>
                </details>
              )}

              <div className="flex gap-2">
                <Button onClick={this.handleRetry} variant="default" className="flex-1">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reintentar
                </Button>
                <Button onClick={this.handleReload} variant="outline" className="flex-1">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Recargar
                </Button>
              </div>

              <Button 
                onClick={this.handleCopyError} 
                variant="ghost" 
                size="sm" 
                className="w-full"
              >
                <Copy className="mr-2 h-3 w-3" />
                Copiar detalles del error
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}
