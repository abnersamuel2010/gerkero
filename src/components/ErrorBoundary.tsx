import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message || 'Erro inesperado no aplicativo.',
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let parsedError: Record<string, unknown> | null = null;
      try {
        parsedError = JSON.parse(this.state.errorMessage);
      } catch {
        parsedError = null;
      }

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h2 className="text-lg font-semibold text-slate-900">
                Alerta de Operação do Sistema
              </h2>
            </div>

            <p className="text-sm text-slate-600">
              Ocorreu uma restrição ou falha durante a comunicação com o banco de dados.
            </p>

            {parsedError ? (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-mono text-slate-700 space-y-1 overflow-x-auto">
                <div>Operação: {String(parsedError.operationType || 'N/A')}</div>
                <div>Caminho: {String(parsedError.path || 'N/A')}</div>
                <div>Detalhe: {String(parsedError.error || 'N/A')}</div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-mono text-slate-700 break-words">
                {this.state.errorMessage}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  this.setState({ hasError: false, errorMessage: '' });
                  window.location.reload();
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Recarregar Sistema
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
