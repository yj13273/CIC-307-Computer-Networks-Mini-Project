/**
 * App Shell & Primary Navigation Controller
 * Complies with Frontend Contract FE-001 Section 3, 5, 6
 */
import { appState } from './app-state.js';
import { renderKnowledgeBase } from '../knowledge-base/knowledge-view.js';
import { renderScenarioSelector } from '../architect/scenario-selector.js';
import { renderScenarioConfig } from '../architect/scenario-config.js';
import { renderAnalysisResults } from '../architect/analysis-view.js';
import { renderExportView } from '../architect/export-view.js';
import { renderDiagnosticsView } from '../diagnostics/error-view.js';
import { renderSessionDrawer } from '../sessions/session-drawer.js';

export function initAppShell() {
  const root = document.getElementById('app-root');
  if (!root) throw new Error('Missing #app-root in DOM');

  // Base layout skeleton
  root.innerHTML = `
    <!-- Header -->
    <header class="app-header">
      <div class="header-inner">
        <div class="brand-wrapper">
          <span class="brand-logo-badge">NET</span>
          <div>
            <div class="brand-title">NetArchitect</div>
            <div class="brand-subtitle">Recommendation & Config Engine • CIC-307</div>
          </div>
        </div>

        <!-- Primary Navigation: Exactly 3 Tabs -->
        <nav class="nav-tabs">
          <button class="nav-tab-btn" data-tab="knowledge">
            📖 Knowledge Base
          </button>
          <button class="nav-tab-btn" data-tab="architect">
            🛠️ Architect
          </button>
          <button class="nav-tab-btn" data-tab="errors">
            ⚠️ Diagnostics
            <span class="nav-pill-count" id="header-error-badge" style="display: none;">0</span>
          </button>
        </nav>

        <!-- Persistent Session History Drawer Toggle -->
        <div class="header-actions">
          <button class="btn-drawer-toggle" id="btn-toggle-session-drawer">
            🕒 Session History
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="app-main" id="main-content-view"></main>

    <!-- Session History Drawer & Overlay -->
    <div class="drawer-overlay" id="session-drawer-overlay"></div>
    <aside class="session-drawer" id="session-drawer"></aside>
  `;

  const mainView = root.querySelector('#main-content-view');
  const drawerOverlay = root.querySelector('#session-drawer-overlay');
  const drawer = root.querySelector('#session-drawer');
  const errorBadge = root.querySelector('#header-error-badge');

  // Bind drawer toggle button
  root.querySelector('#btn-toggle-session-drawer').addEventListener('click', () => {
    appState.toggleSessionDrawer();
  });

  // Bind tab clicks
  root.querySelectorAll('.nav-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      appState.setTab(tab);
    });
  });

  // Render Session Drawer once
  renderSessionDrawer(drawer, drawerOverlay, appState);

  // Render Main View on state changes
  function renderView() {
    // 1. Update navigation active state
    root.querySelectorAll('.nav-tab-btn').forEach(btn => {
      const tab = btn.getAttribute('data-tab');
      btn.classList.toggle('active', tab === appState.activeTab);
    });

    // 2. Update error count badge
    const errors = (appState.diagnostics || []).filter(d => d.severity === 'error');
    if (errors.length > 0) {
      errorBadge.style.display = 'inline-block';
      errorBadge.textContent = errors.length;
      errorBadge.className = 'nav-pill-count error';
    } else {
      errorBadge.style.display = 'none';
    }

    // 3. Update drawer open state
    drawer.classList.toggle('open', appState.sessionDrawerOpen);
    drawerOverlay.classList.toggle('open', appState.sessionDrawerOpen);

    // 4. Render active tab
    mainView.innerHTML = '';

    if (appState.activeTab === 'knowledge') {
      renderKnowledgeBase(mainView, appState);
    } else if (appState.activeTab === 'errors') {
      renderDiagnosticsView(mainView, appState);
    } else if (appState.activeTab === 'architect') {
      renderArchitectStage(mainView, appState);
    }
  }

  appState.subscribe(() => {
    renderView();
  });

  // Initial render
  renderView();
}

/**
 * Renders the 4-stage Architect workflow
 */
function renderArchitectStage(container, state) {
  const currentStage = state.architectStage;

  const stageWrapper = document.createElement('div');

  // Render Stepper
  stageWrapper.innerHTML = `
    <div class="workflow-stepper">
      <div class="step-item ${currentStage === 'selection' ? 'active' : 'completed'}" data-stage="selection">
        <span class="step-num">1</span>
        <span>A. Scenario Selection</span>
      </div>
      <div class="step-divider"></div>
      <div class="step-item ${currentStage === 'review' ? 'active' : (currentStage === 'results' || currentStage === 'export' ? 'completed' : '')}" data-stage="review">
        <span class="step-num">2</span>
        <span>B. Configuration Review</span>
      </div>
      <div class="step-divider"></div>
      <div class="step-item ${currentStage === 'results' ? 'active' : (currentStage === 'export' ? 'completed' : '')}" data-stage="results">
        <span class="step-num">3</span>
        <span>C. Analysis Results</span>
      </div>
      <div class="step-divider"></div>
      <div class="step-item ${currentStage === 'export' ? 'active' : ''}" data-stage="export">
        <span class="step-num">4</span>
        <span>D. Export & Archive</span>
      </div>
    </div>

    <div id="stage-content-body"></div>
  `;

  container.appendChild(stageWrapper);

  const stageBody = stageWrapper.querySelector('#stage-content-body');

  // Allow clicking completed steps to navigate back
  stageWrapper.querySelectorAll('.step-item').forEach(el => {
    el.addEventListener('click', () => {
      const targetStage = el.getAttribute('data-stage');
      if (targetStage === 'selection' || targetStage === 'review') {
        state.setStage(targetStage);
      } else if (targetStage === 'results' && state.analysisResult) {
        state.setStage('results');
      } else if (targetStage === 'export' && state.analysisResult) {
        state.setStage('export');
      }
    });
  });

  switch (currentStage) {
    case 'selection':
      renderScenarioSelector(stageBody, state);
      break;
    case 'review':
      renderScenarioConfig(stageBody, state);
      break;
    case 'results':
      renderAnalysisResults(stageBody, state);
      break;
    case 'export':
      renderExportView(stageBody, state);
      break;
  }
}

