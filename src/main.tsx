import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Makes the site installable as an app (Chrome's "Install app"). Skipped inside embeds such as the Claude artifact viewer.
if (import.meta.env.PROD && 'serviceWorker' in navigator && window.self === window.top) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

// Dev-only handle for automated checks.
if (import.meta.env.DEV) {
  Promise.all([import('./data/app'), import('./lib/nav'), import('./catalog')]).then(([a, n, c]) => {
    (window as unknown as Record<string, unknown>).__p234 = {
      app: a.app,
      nav: n.nav,
      go: (title: string) => c.CATALOG.flatMap((s) => s.items).find((i) => i.title === title)?.go(),
    };
  });
}
