import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Global error handler to catch errors before React mounts or outside Error Boundaries
window.onerror = function(message, source, lineno, colno, error) {
  const errorContainer = document.getElementById('root') || document.body;
  errorContainer.innerHTML = `
    <div style="padding: 20px; color: #ef4444; background: #0f172a; min-height: 100vh; font-family: sans-serif;">
      <h2 style="font-size: 24px; margin-bottom: 10px;">Critical System Error</h2>
      <p style="color: #cbd5e1;">The application failed to start.</p>
      <pre style="background: #1e293b; padding: 15px; border-radius: 8px; overflow: auto; color: #e2e8f0; margin-top: 20px;">
        ${message} at ${source}:${lineno}:${colno}
      </pre>
      <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 5px; cursor: pointer;">
        Reload System
      </button>
    </div>
  `;
  console.error("Global Error Caught:", error);
};

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Error Boundary Component
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("React Error Boundary Caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          direction: 'ltr',
          textAlign: 'left',
          fontFamily: 'sans-serif'
        }}>
          <h1 style={{fontSize: '2rem', marginBottom: '1rem', color: '#ef4444'}}>Application Error</h1>
          <div style={{backgroundColor: '#1e293b', padding: '1.5rem', borderRadius: '0.75rem', maxWidth: '800px', width: '100%', overflow: 'auto', border: '1px solid #334155'}}>
             <p style={{marginBottom: '1rem', color: '#94a3b8'}}>An unexpected error occurred within the application interface.</p>
             <code style={{fontFamily: 'monospace', color: '#e2e8f0', display: 'block', whiteSpace: 'pre-wrap'}}>
               {this.state.error?.toString()}
             </code>
          </div>
          <button 
            onClick={() => window.location.reload()}
            style={{marginTop: '2rem', padding: '0.75rem 1.5rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem'}}
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const container = document.getElementById('root');
if (container) {
  try {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );
  } catch (e) {
    console.error("Root Render Error:", e);
    // Fallback manual render if createRoot fails
    container.innerHTML = '<div style="color:red; padding:20px;">Fatal Error: Could not mount application. Check console.</div>';
  }
}