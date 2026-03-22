import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import App from './App.tsx';
import './index.css';
import { enableSecurity } from './lib/security';

if (import.meta.env.PROD) {
  enableSecurity();
  performance.mark('app-start');
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('🚨 Élément #root introuvable.');
}

const root = createRoot(rootElement);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);

if (import.meta.env.PROD) {
  window.addEventListener('load', () => {
    performance.mark('app-end');
    performance.measure('app-render', 'app-start', 'app-end');
    const measure = performance.getEntriesByName('app-render')[0];
    console.log(`⏱️ Temps de rendu initial : ${measure.duration.toFixed(2)} ms`);
  });
}
