import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './app/App';
import { initInBrowserContractEngine } from './shared/api/inBrowserContractEngine';

// Start In-Browser Contract Engine for seamless deployment & local offline operation
initInBrowserContractEngine();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
