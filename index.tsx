
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('App crashed:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', background: '#09090b', color: '#f4f4f5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', fontFamily: 'sans-serif' }}>
          <div style={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: '16px', padding: '2rem', maxWidth: '500px', width: '100%' }}>
            <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>Uygulama hatası</h2>
            <p style={{ color: '#a1a1aa', marginBottom: '1rem', fontSize: '14px' }}>Lütfen sayfayı yenileyin. Sorun devam ederse bildirim yapın.</p>
            <pre style={{ background: '#000', padding: '1rem', borderRadius: '8px', fontSize: '12px', color: '#f87171', overflow: 'auto', maxHeight: '200px' }}>
              {this.state.error?.toString()}
            </pre>
            <button
              onClick={() => window.location.reload()}
              style={{ marginTop: '1rem', background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.75rem 1.5rem', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Yenile
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
