/**
 * Main Application Entry Point
 * NetArchitect Web Interface
 */
import { initAppShell } from './ui/app/app-shell.js';

window.addEventListener('DOMContentLoaded', () => {
  try {
    initAppShell();
  } catch (err) {
    console.error('Failed to initialize NetArchitect AppShell:', err);
    const root = document.getElementById('app-root');
    if (root) {
      root.innerHTML = `
        <div style="padding: 2rem; color: #b91c1c; font-family: sans-serif;">
          <h2>Application Initialization Error</h2>
          <pre>${err.stack || err.message}</pre>
        </div>
      `;
    }
  }
});

