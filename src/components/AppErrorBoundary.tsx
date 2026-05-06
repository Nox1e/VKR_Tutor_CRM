import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
    error: undefined,
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('Unhandled application error', error, info);
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
          <div className="max-w-md text-center space-y-6">
            <div>
              <h1 className="text-2xl font-semibold mb-2">Что-то пошло не так</h1>
              <p className="text-muted-foreground">
                {this.state.error?.message ?? 'Произошла непредвиденная ошибка. Попробуйте обновить страницу.'}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button onClick={this.handleReset} variant="outline">
                Попробовать снова
              </Button>
              <Button onClick={() => window.location.reload()}>Перезагрузить страницу</Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
