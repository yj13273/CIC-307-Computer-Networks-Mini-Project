/**
 * Diagnostics & Errors View Component
 * Complies with Frontend Contract FE-001 Section 3.3
 */
import { generateArchitecture } from '../../core/architecture-service.js';

export function renderDiagnosticsView(container, state) {
  let severityFilter = 'all'; // 'all' | 'error' | 'warning' | 'info'
  let searchFilter = '';

  const diagnostics = state.diagnostics || [];

  function updateView() {
    const filtered = diagnostics.filter(d => {
      if (severityFilter !== 'all' && d.severity !== severityFilter) return false;
      if (!searchFilter) return true;
      const q = searchFilter.toLowerCase();
      return (d.code || '').toLowerCase().includes(q) ||
             (d.description || '').toLowerCase().includes(q) ||
             (d.affectedEntity || '').toLowerCase().includes(q);
    });

    const errorCount = diagnostics.filter(d => d.severity === 'error').length;
    const warningCount = diagnostics.filter(d => d.severity === 'warning').length;
    const infoCount = diagnostics.filter(d => d.severity === 'info').length;

    container.innerHTML = `
      <div style="margin-bottom: 1.5rem;">
        <h1 style="font-size: 1.5rem; font-weight: 800; letter-spacing: -0.02em;">Centralized Diagnostics & Constraint Auditing</h1>
        <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 0.25rem;">
          Real-time detection of physical distance violations, address space exhaustions, referential integrity flaws, and security warnings.
        </p>
      </div>

      <!-- Quick Action / Interactive Boundary Testing Sandbox -->
      <div class="panel-card" style="margin-bottom: 1.5rem; border-left: 4px solid #000;">
        <div class="panel-title">
          <span>Boundary Violation & Algorithmic Defense Sandbox</span>
          <span class="badge badge-neutral">Interactive Test Bench</span>
        </div>
        <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 0.75rem;">
          Trigger specific boundary conditions directly to verify algorithmic error handling and self-explaining defenses:
        </p>
        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
          <button class="btn btn-secondary btn-sm" id="btn-trigger-copper-violation">
            ⚡ Simulate Copper > 100m (PhysicalDistanceViolationError)
          </button>
          <button class="btn btn-secondary btn-sm" id="btn-trigger-subnet-exhaustion">
            ⚡ Simulate Subnet Space Exhaustion
          </button>
          <button class="btn btn-secondary btn-sm" id="btn-trigger-invalid-cidr">
            ⚡ Simulate Malformed Root Prefix
          </button>
          <button class="btn btn-secondary btn-sm" id="btn-clear-diagnostics">
            Clear Diagnostics
          </button>
        </div>
      </div>

      <!-- Filters & Counter Bar -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.75rem;">
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn btn-sm ${severityFilter === 'all' ? 'btn-primary' : 'btn-secondary'} btn-filter-sev" data-sev="all">
            All (${diagnostics.length})
          </button>
          <button class="btn btn-sm ${severityFilter === 'error' ? 'btn-primary' : 'btn-secondary'} btn-filter-sev" data-sev="error">
            Errors (${errorCount})
          </button>
          <button class="btn btn-sm ${severityFilter === 'warning' ? 'btn-primary' : 'btn-secondary'} btn-filter-sev" data-sev="warning">
            Warnings (${warningCount})
          </button>
          <button class="btn btn-sm ${severityFilter === 'info' ? 'btn-primary' : 'btn-secondary'} btn-filter-sev" data-sev="info">
            Info (${infoCount})
          </button>
        </div>

        <input 
          type="text" 
          id="diag-search" 
          placeholder="Filter by code or entity..." 
          value="${searchFilter}"
          style="padding: 0.4rem 0.75rem; border: 1px solid var(--border-strong); border-radius: var(--radius-md); font-family: inherit; font-size: 0.82rem; min-width: 240px;"
        />
      </div>

      <!-- Diagnostics Table / List -->
      ${filtered.length === 0 ? `
        <div class="panel-card" style="text-align: center; padding: 2.5rem 1rem;">
          <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">✅</div>
          <div style="font-weight: 700; font-size: 0.95rem;">No Diagnostics Found</div>
          <div style="color: var(--text-muted); font-size: 0.82rem; margin-top: 0.25rem;">
            ${diagnostics.length === 0 ? 'No errors or warnings recorded. Run architecture analysis or use the test bench above to simulate violations.' : 'No entries match your search/filter criteria.'}
          </div>
        </div>
      ` : `
        <div class="data-table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Severity</th>
                <th>Error Code</th>
                <th>Affected Entity</th>
                <th>Description</th>
                <th>Expected Constraint</th>
                <th>Actual Value</th>
                <th>Remediation / Resolution</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(d => {
                let badgeClass = 'badge-neutral';
                if (d.severity === 'error') badgeClass = 'badge-error';
                else if (d.severity === 'warning') badgeClass = 'badge-warning';
                else if (d.severity === 'info') badgeClass = 'badge-info';

                return `
                  <tr>
                    <td><span class="badge ${badgeClass}">${d.severity}</span></td>
                    <td class="code-font" style="font-weight: 700; color: #000;">${d.code}</td>
                    <td class="code-font">${d.affectedEntity || 'System'}</td>
                    <td style="line-height: 1.45; font-size: 0.82rem;">${d.description}</td>
                    <td style="font-size: 0.8rem; color: var(--text-muted);">${d.expectedConstraint || '—'}</td>
                    <td class="code-font" style="color: #dc2626;">${d.actualValue || '—'}</td>
                    <td style="font-size: 0.8rem; color: #166534; font-weight: 500;">${d.suggestedResolution || '—'}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `}
    `;

    // Filter events
    container.querySelectorAll('.btn-filter-sev').forEach(btn => {
      btn.addEventListener('click', () => {
        severityFilter = btn.getAttribute('data-sev');
        updateView();
      });
    });

    const searchInput = container.querySelector('#diag-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchFilter = e.target.value;
        updateView();
        const nextInput = container.querySelector('#diag-search');
        if (nextInput) {
          nextInput.focus();
          nextInput.setSelectionRange(searchFilter.length, searchFilter.length);
        }
      });
    }

    // Trigger simulation buttons
    container.querySelector('#btn-trigger-copper-violation')?.addEventListener('click', async () => {
      const cloned = JSON.parse(JSON.stringify(state.currentScenario));
      cloned.parameters.links[0].requestedMedium = 'copper';
      cloned.parameters.links[0].intentMedium = 'copper';
      cloned.parameters.links[0].distanceM = 160; // >100m copper violation!
      const res = await generateArchitecture(cloned.profileId, cloned);
      state.setAnalysisResult(res);
      updateView();
    });

    container.querySelector('#btn-trigger-subnet-exhaustion')?.addEventListener('click', async () => {
      const cloned = JSON.parse(JSON.stringify(state.currentScenario));
      cloned.parameters.addressing.rootPrefix = '192.168.1.0/28'; // Only 16 IPs total!
      cloned.parameters.addressing.subnetRequests = [
        { name: 'Oversized Subnet A', hosts: 500, vlanId: 10 },
        { name: 'Oversized Subnet B', hosts: 300, vlanId: 20 }
      ];
      const res = await generateArchitecture(cloned.profileId, cloned);
      state.setAnalysisResult(res);
      updateView();
    });

    container.querySelector('#btn-trigger-invalid-cidr')?.addEventListener('click', async () => {
      const cloned = JSON.parse(JSON.stringify(state.currentScenario));
      cloned.parameters.addressing.rootPrefix = '999.888.777.0/99'; // Malformed IP/prefix!
      const res = await generateArchitecture(cloned.profileId, cloned);
      state.setAnalysisResult(res);
      updateView();
    });

    container.querySelector('#btn-clear-diagnostics')?.addEventListener('click', () => {
      state.diagnostics = [];
      updateView();
    });
  }

  updateView();
}

