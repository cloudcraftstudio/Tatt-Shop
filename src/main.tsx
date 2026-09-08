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
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
