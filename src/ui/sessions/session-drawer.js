/**
 * Session History Drawer Component
 * Complies with Frontend Contract FE-001 Section 4
 */
import { getAllSessions, deleteSession, renameSession, duplicateSession, getSessionById } from './session-storage.js';

export function renderSessionDrawer(drawerContainer, overlayContainer, state) {
  let sessionsList = [];
  let compareSessionA = null;
  let compareSessionB = null;

  async function loadSessions() {
    sessionsList = await getAllSessions();
    updateView();
  }

  function updateView() {
    drawerContainer.innerHTML = `
      <div class="drawer-header">
        <div>
          <div class="drawer-title">Session History</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">
            Persistent IndexedDB Archive (${sessionsList.length} saved)
          </div>
        </div>
        <button class="btn btn-secondary btn-sm" id="btn-close-drawer">✕</button>
      </div>

      <div class="drawer-body">
        ${sessionsList.length === 0 ? `
          <div style="text-align: center; padding: 2rem 1rem; color: var(--text-muted); font-size: 0.85rem;">
            No saved sessions yet.<br />
            Run an architecture analysis and click "Save Session" in the Export stage to persist designs here.
          </div>
        ` : `
          <div style="display: flex; justify-content: flex-end; margin-bottom: 0.75rem;">
            <button class="btn btn-secondary btn-sm" id="btn-open-compare" ${sessionsList.length < 2 ? 'disabled' : ''}>
              ⚖️ Compare Two Sessions
            </button>
          </div>

          <div style="display: flex; flex-direction: column;">
            ${sessionsList.map(s => {
              const dateStr = new Date(s.createdAt || s.updatedAt).toLocaleString();
              const summary = s.summary || {};

              return `
                <div class="session-card-item">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                      <div class="session-card-name">${s.name}</div>
                      <div class="session-card-time">${dateStr}</div>
                    </div>
                    <span class="badge badge-neutral" style="font-family: var(--font-mono); font-size: 0.7rem;">
                      ${s.scenarioId}
                    </span>
                  </div>

                  <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.4rem; display: flex; gap: 0.75rem;">
                    <span>Devices: <strong>${summary.devices || '—'}</strong></span>
                    <span>Subnets: <strong>${summary.subnets || '—'}</strong></span>
                    <span>Efficiency: <strong>${summary.efficiencyPct ? summary.efficiencyPct + '%' : '—'}</strong></span>
                  </div>

                  <div class="session-actions">
                    <button class="btn btn-primary btn-sm btn-load-session" data-id="${s.id}">
                      Open
                    </button>
                    <button class="btn btn-secondary btn-sm btn-rename-session" data-id="${s.id}">
                      Rename
                    </button>
                    <button class="btn btn-secondary btn-sm btn-duplicate-session" data-id="${s.id}">
                      Duplicate
                    </button>
                    <button class="btn btn-secondary btn-sm btn-export-session" data-id="${s.id}">
                      Export
                    </button>
                    <button class="btn btn-danger btn-sm btn-delete-session" data-id="${s.id}">
                      Delete
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>

      <div class="drawer-footer">
        <button class="btn btn-secondary btn-sm" id="btn-refresh-sessions" style="width: 100%;">
          🔄 Refresh Session List
        </button>
      </div>

      <!-- Compare Modal Container -->
      <div id="compare-modal-box"></div>
    `;

    // Close event
    drawerContainer.querySelector('#btn-close-drawer')?.addEventListener('click', () => {
      state.toggleSessionDrawer(false);
    });

    overlayContainer.addEventListener('click', () => {
      state.toggleSessionDrawer(false);
    });

    // Refresh
    drawerContainer.querySelector('#btn-refresh-sessions')?.addEventListener('click', loadSessions);

    // Open Compare
    drawerContainer.querySelector('#btn-open-compare')?.addEventListener('click', () => {
      renderCompareModal();
    });

    // Open session
    drawerContainer.querySelectorAll('.btn-load-session').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const session = await getSessionById(id);
        if (session) {
          state.selectedProfileId = session.scenarioId;
          state.currentScenario = session.originalScenario;
          state.analysisResult = session.analysisResult;
          state.activeTab = 'architect';
          state.architectStage = 'results';
          state.toggleSessionDrawer(false);
          state.notify();
        }
      });
    });

    // Rename
    drawerContainer.querySelectorAll('.btn-rename-session').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const current = sessionsList.find(s => s.id === id);
        const newName = prompt('Enter new session name:', current?.name || '');
        if (newName && newName.trim()) {
          await renameSession(id, newName.trim());
          loadSessions();
        }
      });
    });

    // Duplicate
    drawerContainer.querySelectorAll('.btn-duplicate-session').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        await duplicateSession(id);
        loadSessions();
      });
    });

    // Export
    drawerContainer.querySelectorAll('.btn-export-session').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const s = await getSessionById(id);
        if (s) {
          const blob = new Blob([JSON.stringify(s, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `session_${s.id}.json`;
          a.click();
          URL.revokeObjectURL(url);
        }
      });
    });

    // Delete
    drawerContainer.querySelectorAll('.btn-delete-session').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Are you sure you want to delete this saved session?')) {
          await deleteSession(id);
          loadSessions();
        }
      });
    });
  }

  function renderCompareModal() {
    const box = drawerContainer.querySelector('#compare-modal-box');
    if (!box) return;

    if (!compareSessionA) compareSessionA = sessionsList[0]?.id;
    if (!compareSessionB) compareSessionB = sessionsList[1]?.id || sessionsList[0]?.id;

    const sA = sessionsList.find(s => s.id === compareSessionA);
    const sB = sessionsList.find(s => s.id === compareSessionB);

    box.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content" style="max-width: 850px;">
          <div class="modal-header">
            <h3 style="font-size: 1.15rem; font-weight: 800;">Compare Two Architecture Sessions</h3>
            <button class="btn btn-secondary btn-sm" id="btn-close-compare">✕</button>
          </div>
          <div class="modal-body">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem;">
              <div>
                <label style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">Session A</label>
                <select id="select-compare-a" style="width: 100%; padding: 0.4rem; border: 1px solid var(--border-strong); border-radius: 4px; font-size: 0.82rem;">
                  ${sessionsList.map(s => `<option value="${s.id}" ${s.id === compareSessionA ? 'selected' : ''}>${s.name}</option>`).join('')}
                </select>
              </div>
              <div>
                <label style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">Session B</label>
                <select id="select-compare-b" style="width: 100%; padding: 0.4rem; border: 1px solid var(--border-strong); border-radius: 4px; font-size: 0.82rem;">
                  ${sessionsList.map(s => `<option value="${s.id}" ${s.id === compareSessionB ? 'selected' : ''}>${s.name}</option>`).join('')}
                </select>
              </div>
            </div>

            <div class="data-table-wrapper">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Metric / Attribute</th>
                    <th>Session A (${sA?.name || 'A'})</th>
                    <th>Session B (${sB?.name || 'B'})</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="font-weight: 700;">Scenario Profile</td>
                    <td class="code-font">${sA?.scenarioId || '—'}</td>
                    <td class="code-font">${sB?.scenarioId || '—'}</td>
                  </tr>
                  <tr>
                    <td style="font-weight: 700;">Root Prefix</td>
                    <td class="code-font">${sA?.analysisResult?.analysis?.addressing?.rootCidr || '—'}</td>
                    <td class="code-font">${sB?.analysisResult?.analysis?.addressing?.rootCidr || '—'}</td>
                  </tr>
                  <tr>
                    <td style="font-weight: 700;">Subnets Allocated</td>
                    <td>${sA?.analysisResult?.analysis?.addressing?.allocations?.length || 0} subnets</td>
                    <td>${sB?.analysisResult?.analysis?.addressing?.allocations?.length || 0} subnets</td>
                  </tr>
                  <tr>
                    <td style="font-weight: 700;">Host Packing Efficiency</td>
                    <td><strong>${sA?.summary?.efficiencyPct || 0}%</strong></td>
                    <td><strong>${sB?.summary?.efficiencyPct || 0}%</strong></td>
                  </tr>
                  <tr>
                    <td style="font-weight: 700;">Routing Protocol</td>
                    <td>${sA?.analysisResult?.analysis?.routing?.decision?.outcome?.protocol || '—'}</td>
                    <td>${sB?.analysisResult?.analysis?.routing?.decision?.outcome?.protocol || '—'}</td>
                  </tr>
                  <tr>
                    <td style="font-weight: 700;">Decisions Evaluated</td>
                    <td>${sA?.analysisResult?.decisions?.length || 0} rules</td>
                    <td>${sB?.analysisResult?.decisions?.length || 0} rules</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary btn-sm" id="btn-done-compare">Done</button>
          </div>
        </div>
      </div>
    `;

    box.querySelector('#btn-close-compare').addEventListener('click', () => { box.innerHTML = ''; });
    box.querySelector('#btn-done-compare').addEventListener('click', () => { box.innerHTML = ''; });

    box.querySelector('#select-compare-a').addEventListener('change', (e) => {
      compareSessionA = e.target.value;
      renderCompareModal();
    });

    box.querySelector('#select-compare-b').addEventListener('change', (e) => {
      compareSessionB = e.target.value;
      renderCompareModal();
    });
  }

  // Initial load
  loadSessions();
}

