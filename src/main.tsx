import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './app/App';
import { initInBrowserContractEngine } from './shared/api/inBrowserContractEngine';
import { initObservability } from './shared/observability';

// Start In-Browser Contract Engine for seamless deployment & local offline operation
initInBrowserContractEngine();

// Initialize Observability Runtime Foundation (safe No-Op by default; isolated from app startup)
initObservability();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
