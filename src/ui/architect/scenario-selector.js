/**
 * Architect Workflow: Stage A — Scenario Selector
 * Complies with Frontend Contract FE-001 Section 3.2 Stage A
 */
import { PRESET_SCENARIOS } from '../../data/scenarios/scenarios-data.js';

export function renderScenarioSelector(container, state) {
  const scenarios = Object.values(PRESET_SCENARIOS);

  container.innerHTML = `
    <div style="margin-bottom: 1.5rem;">
      <h1 style="font-size: 1.5rem; font-weight: 800; letter-spacing: -0.02em;">Select Enterprise Scenario</h1>
      <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 0.25rem;">
        Choose one of the three architectural profiles defined in the CIC-307 specification to review engineering parameters and execute recommendation engines.
      </p>
    </div>

    <div class="scenarios-grid">
      ${scenarios.map(sc => {
        const isSelected = sc.profileId === state.selectedProfileId;
        const p = sc.parameters || {};
        const sitesCount = (p.sites || []).length;
        const endpoints = p.scale?.totalEndpoints || 0;
        const rootPrefix = p.addressing?.rootPrefix || 'N/A';
        const routingProto = p.routing?.protocol || 'OSPF';

        return `
          <div class="scenario-card ${isSelected ? 'selected' : ''}" data-id="${sc.profileId}">
            <div class="scenario-card-header">
              <span class="badge ${isSelected ? 'badge-neutral' : 'badge-neutral'}" style="font-family: var(--font-mono);">
                ${sc.profileId}
              </span>
              <h2 class="scenario-card-title">${sc.displayName}</h2>
              <div class="scenario-card-scope">${sc.scope}</div>
            </div>

            <p class="scenario-card-desc">
              ${sc.description}
            </p>

            <ul class="scenario-spec-list">
              <li>
                <span class="scenario-spec-label">Sites / Facilities</span>
                <span class="scenario-spec-val">${sitesCount} Sites</span>
              </li>
              <li>
                <span class="scenario-spec-label">Endpoint Population</span>
                <span class="scenario-spec-val">${endpoints.toLocaleString()} Nodes</span>
              </li>
              <li>
                <span class="scenario-spec-label">Root IPv4 Prefix</span>
                <span class="scenario-spec-val code-font">${rootPrefix}</span>
              </li>
              <li>
                <span class="scenario-spec-label">Routing Architecture</span>
                <span class="scenario-spec-val">${routingProto}</span>
              </li>
            </ul>

            <button class="btn ${isSelected ? 'btn-primary' : 'btn-secondary'} btn-select-scenario" data-id="${sc.profileId}" style="width: 100%;">
              ${isSelected ? 'Selected (Proceed to Review)' : 'Select Profile'}
            </button>
          </div>
        `;
      }).join('')}
    </div>
  `;

  container.querySelectorAll('.btn-select-scenario, .scenario-card').forEach(el => {
    el.addEventListener('click', (e) => {
      const profileId = el.getAttribute('data-id');
      if (profileId) {
        state.selectScenario(profileId);
      }
    });
  });
}

