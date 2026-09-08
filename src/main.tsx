import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';

// Suppress benign ResizeObserver error
const resizeObserverLoopErr = 'ResizeObserver loop completed with undelivered notifications.';
const resizeObserverLoopErr2 = 'ResizeObserver loop limit exceeded';

const originalError = window.console.error;
window.console.error = (...args) => {
  if (args.length > 0 && typeof args[0] === 'string' && (args[0].includes(resizeObserverLoopErr) || args[0].includes(resizeObserverLoopErr2))) {
    return;
  }
  originalError(...args);
};

window.addEventListener('error', (e) => {
  if (e.message.includes(resizeObserverLoopErr) || e.message.includes(resizeObserverLoopErr2)) {
    e.stopImmediatePropagation();
  }
});

import App from './App.tsx';
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div style={{color: 'red', padding: '20px', background: 'white', zIndex: 9999, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%'}}>
        <h1>Something went wrong.</h1>
        <pre>{this.state.error && this.state.error.toString()}</pre>
        <pre>{this.state.error && this.state.error.stack}</pre>
      </div>;
    }
    return this.props.children; 
  }
}

import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary><App /></ErrorBoundary>
  </StrictMode>,
);
