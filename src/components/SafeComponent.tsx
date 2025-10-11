import { Component, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  componentName: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary específico para componentes individuales
 * Aísla fallos para que no tumben toda la app
 */
export class SafeComponent extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[SafeComponent: ${this.props.componentName}] Error:`, {
      error,
      errorInfo,
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-2">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="text-sm">Error en {this.props.componentName}</AlertTitle>
            <AlertDescription className="text-xs">
              {this.state.error?.message || 'Error desconocido'}
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}
