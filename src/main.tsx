import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

const rootElement = document.getElementById('root');

if (rootElement) {
  try {
    createRoot(rootElement).render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>,
    );
  } catch (error) {
    console.error('Fatal render error:', error);
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center; font-family: sans-serif;">
        <h1>Erro ao carregar a página</h1>
        <p>Não foi possível iniciar o aplicativo. Por favor, recarregue a página.</p>
        <button onclick="window.location.reload()">Recarregar</button>
        <pre style="text-align: left; background: #eee; padding: 10px; margin-top: 20px;">${error}</pre>
      </div>
    `;
  }
}
