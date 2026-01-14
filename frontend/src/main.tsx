import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import './styles/scrollbar.css';

// Suppress browser extension errors (React DevTools, etc.)
const originalError = console.error;
console.error = (...args: any[]) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('A listener indicated an asynchronous response by returning true')
  ) {
    // Suppress this specific browser extension error
    return;
  }
  originalError.apply(console, args);
};

// Suppress unhandled promise rejections from browser extensions
window.addEventListener('unhandledrejection', (event) => {
  if (
    event.reason?.message?.includes('A listener indicated an asynchronous response') ||
    event.reason?.message?.includes('message channel closed')
  ) {
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
