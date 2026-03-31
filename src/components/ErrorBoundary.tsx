import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Standard Error Boundary to catch runtime errors.
 * Re-written to be dependency-free (no lucide-react) for maximum stability
 * even when the application bundle fails to load partially.
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f9fafb',
          padding: '1rem',
          fontFamily: 'sans-serif'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '1rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid #fee2e2',
            padding: '2rem',
            maxWidth: '32rem',
            width: '100%',
            textAlign: 'center'
          }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>
              Ops! Algo deu errado
            </h1>
            <p style={{ color: '#4b5563', marginBottom: '2rem' }}>
              Ocorreu um erro inesperado que impediu o carregamento da página. Tente recarregar ou voltar para o início.
            </p>

            {this.state.error && (
              <div style={{
                backgroundColor: '#fef2f2',
                borderRadius: '0.5rem',
                padding: '1rem',
                marginBottom: '2rem',
                textAlign: 'left',
                overflow: 'auto',
                maxHeight: '10rem'
              }}>
                <p style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#991b1b', wordBreak: 'break-all' }}>
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  fontWeight: '500',
                  padding: '0.625rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Recarregar Página
              </button>
              <button
                onClick={this.handleReset}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  fontWeight: '500',
                  padding: '0.625rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Ir para o Início
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
