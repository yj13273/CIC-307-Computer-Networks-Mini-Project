/**
 * Architect Workflow: Stage B — Configuration Review
 * Complies with Frontend Contract FE-001 Section 3.2 Stage B
 */
import { formatDistance, formatBandwidth } from '../../utils/units.js';
import { generateArchitecture } from '../../core/architecture-service.js';

export function renderScenarioConfig(container, state) {
  const scenario = state.currentScenario;
  const p = scenario.parameters || {};

  container.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
      <div>
        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
          <span class="badge badge-neutral" style="font-family: var(--font-mono);">${scenario.profileId}</span>
          <span class="badge badge-info">v${scenario.schemaVersion || '1.0'}</span>
        </div>
        <h1 style="font-size: 1.5rem; font-weight: 800; letter-spacing: -0.02em;">${scenario.displayName} — Parameter Review</h1>
        <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 0.25rem;">
          Verify ingested physical distances, device roles, addressing constraints, and routing policies before generating recommendations.
        </p>
      </div>

      <div style="display: flex; gap: 0.5rem;">
        <button class="btn btn-secondary btn-sm" id="btn-back-stage-a">
          ← Change Profile
        </button>
        <button class="btn btn-secondary btn-sm" id="btn-reset-preset">
          Reset to Preset
        </button>
      </div>
    </div>

    <!-- Configuration Review Panels Grid -->
    <div class="review-section">
      <!-- 1. Physical Infrastructure & Scale -->
      <div class="panel-card">
        <div class="panel-title">
          <span>1. Physical Infrastructure & Scale</span>
          <span class="badge badge-neutral">${p.scale?.totalEndpoints || 0} Endpoints</span>
        </div>
        <table class="data-table">
          <tbody>
            <tr>
              <td style="font-weight: 600; width: 45%;">Facilities / Sites</td>
              <td>${(p.sites || []).length} physical sites defined</td>
            </tr>
            <tr>
              <td style="font-weight: 600;">Max Link Distance</td>
              <td>${p.scale?.maxDistanceM ? formatDistance(p.scale.maxDistanceM) : (p.scale?.maxDistanceKm ? `${p.scale.maxDistanceKm} km` : 'Variable')}</td>
            </tr>
            <tr>
              <td style="font-weight: 600;">Managed Devices</td>
              <td>${(p.devices || []).length} devices (Core, Distribution, Perimeter)</td>
            </tr>
            <tr>
              <td style="font-weight: 600;">Interconnect Links</td>
              <td>${(p.links || []).length} physical spans</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 2. Sites & Facilities -->
      <div class="panel-card">
        <div class="panel-title">
          <span>2. Sites & Locations</span>
          <span class="badge badge-neutral">${(p.sites || []).length} Locations</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          ${(p.sites || []).map(s => `
            <div style="background-color: var(--bg-card-subtle); padding: 0.5rem 0.75rem; border-radius: var(--radius-sm); font-size: 0.82rem;">
              <div style="font-weight: 700; color: var(--text-main);">${s.name}</div>
              <div style="color: var(--text-muted); font-size: 0.75rem;">Role: ${s.role || 'General'} ${s.region ? `| Region: ${s.region}` : ''} ${s.latencyTargetMs ? `| Target Latency: ${s.latencyTargetMs}ms` : ''}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- 3. Physical Links & Proposed Media -->
      <div class="panel-card" style="grid-column: 1 / -1;">
        <div class="panel-title">
          <span>3. Physical Link Topology & Distance Measurements</span>
          <span class="badge badge-neutral">${(p.links || []).length} Links</span>
        </div>
        <div class="data-table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Link Identifier</th>
                <th>Source Endpoint</th>
                <th>Target Endpoint</th>
                <th>Distance</th>
                <th>Bandwidth Demand</th>
                <th>Intent Medium</th>
                <th>Redundant</th>
              </tr>
            </thead>
            <tbody>
              ${(p.links || []).map(l => `
                <tr>
                  <td style="font-weight: 600;">${l.name || l.id}</td>
                  <td class="code-font">${l.sourceEndpointId}</td>
                  <td class="code-font">${l.targetEndpointId}</td>
                  <td style="font-weight: 700;">${formatDistance(l.distanceM)}</td>
                  <td>${formatBandwidth(l.bandwidthRequirementBps)}</td>
                  <td><span class="badge badge-neutral">${l.intentMedium || 'auto'}</span></td>
                  <td>${l.redundant ? '✓ Yes' : '— No'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- 4. Addressing & VLSM Demand -->
      <div class="panel-card">
        <div class="panel-title">
          <span>4. IP Addressing & Subnet Requests</span>
          <span class="badge badge-neutral code-font">${p.addressing?.rootPrefix || 'N/A'}</span>
        </div>
        <div style="font-size: 0.82rem; margin-bottom: 0.5rem; color: var(--text-muted);">
          Root Prefix: <strong class="code-font" style="color: #000;">${p.addressing?.rootPrefix}</strong> | Allocation Strategy: <strong>${p.addressing?.strategy}</strong>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Subnet Name</th>
              <th>VLAN ID</th>
              <th>Host Demand</th>
            </tr>
          </thead>
          <tbody>
            ${(p.addressing?.subnetRequests || []).map(sub => `
              <tr>
                <td>${sub.name}</td>
                <td><span class="badge badge-neutral">${sub.vlanId || '—'}</span></td>
                <td style="font-weight: 700;">${sub.hosts} hosts</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- 5. Switching, Routing & Security Constraints -->
      <div class="panel-card">
        <div class="panel-title">
          <span>5. Layer 2, Layer 3 & Security Policies</span>
        </div>
        <table class="data-table">
          <tbody>
            <tr>
              <td style="font-weight: 600; width: 40%;">VLAN Tagging</td>
              <td>${p.switching?.vlanTagging || '802.1Q'}</td>
            </tr>
            <tr>
              <td style="font-weight: 600;">Spanning Tree</td>
              <td>${p.switching?.spanningTree || 'Rapid-PVST+ (IEEE 802.1w)'}</td>
            </tr>
            <tr>
              <td style="font-weight: 600;">Routing Protocol</td>
              <td>${p.routing?.protocol || 'OSPF'} (Area: ${p.routing?.area || p.routing?.backboneArea || '0'})</td>
            </tr>
            <tr>
              <td style="font-weight: 600;">Security / ACLs</td>
              <td>${p.security?.aclStrategy || p.security?.vpn || 'Role-based Isolation'}</td>
            </tr>
            <tr>
              <td style="font-weight: 600;">Resiliency Model</td>
              <td>${p.resiliency?.topology || 'Dual-Homed Failover'}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Action Bar -->
    <div class="action-bar-bottom">
      <div>
        <div style="font-size: 0.85rem; font-weight: 600;">Ready for Architecture Analysis</div>
        <div style="font-size: 0.75rem; color: var(--text-muted);">
          The engine will execute physical media dispersion calculations, bitwise VLSM allocation, and Cisco configuration generation.
        </div>
      </div>
      <div style="display: flex; gap: 0.75rem;">
        <button class="btn btn-secondary" id="btn-open-boundary-test">
          Boundary Test / Overrides
        </button>
        <button class="btn btn-primary" id="btn-run-analysis" style="padding: 0.65rem 1.5rem; font-size: 0.95rem;">
          <span id="btn-run-spinner" style="display: none;">⏳</span>
          ⚡ Run Architecture Analysis
        </button>
      </div>
    </div>

    <!-- Boundary Test Modal Placeholder -->
    <div id="boundary-test-modal-container"></div>
  `;

  // Attach navigation
  container.querySelector('#btn-back-stage-a').addEventListener('click', () => {
    state.setStage('selection');
  });

  container.querySelector('#btn-reset-preset').addEventListener('click', () => {
    state.resetCurrentScenario();
    renderScenarioConfig(container, state);
  });

  // Attach Run Analysis
  container.querySelector('#btn-run-analysis').addEventListener('click', async () => {
    const btn = container.querySelector('#btn-run-analysis');
    const spinner = container.querySelector('#btn-run-spinner');
    btn.disabled = true;
    if (spinner) spinner.style.display = 'inline';

    try {
      const result = await generateArchitecture(state.selectedProfileId, state.currentScenario);
      state.setAnalysisResult(result);
    } catch (err) {
      alert('Analysis execution failed: ' + err.message);
    } finally {
      btn.disabled = false;
      if (spinner) spinner.style.display = 'none';
    }
  });

  // Attach Boundary Test Modal
  container.querySelector('#btn-open-boundary-test').addEventListener('click', () => {
    openBoundaryTestModal(container, state);
  });
}

function openBoundaryTestModal(container, state) {
  const modalContainer = container.querySelector('#boundary-test-modal-container');
  const links = state.currentScenario.parameters.links || [];

  modalContainer.innerHTML = `
    <div class="modal-overlay" id="boundary-modal">
      <div class="modal-content">
        <div class="modal-header">
          <div>
            <h3 style="font-size: 1.1rem; font-weight: 800;">Boundary & Edge-Case Parameter Sandbox</h3>
            <p style="font-size: 0.75rem; color: var(--text-muted);">
              Test physical distance violation (e.g. Copper > 100m) or modify link parameters to observe engine diagnostics.
            </p>
          </div>
          <button class="btn btn-secondary btn-sm" id="btn-close-modal">✕</button>
        </div>
        <div class="modal-body">
          <div style="background-color: var(--badge-warning-bg); border: 1px solid var(--badge-warning-border); padding: 0.75rem; border-radius: var(--radius-md); font-size: 0.8rem; margin-bottom: 1rem;">
            <strong>Test Distance Violation:</strong> Setting any link's Intent Medium to <code>copper</code> with distance <code>> 100m</code> will trigger the mandatory <code>PhysicalDistanceViolationError</code> defined in Section 3 of the PDF rubric.
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            ${links.map((link, idx) => `
              <div style="border: 1px solid var(--border-subtle); padding: 0.75rem; border-radius: var(--radius-sm); background: #ffffff;">
                <div style="font-weight: 700; font-size: 0.85rem; margin-bottom: 0.4rem;">${link.name || link.id}</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                  <div>
                    <label style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 0.2rem;">Distance (Meters)</label>
                    <input type="number" class="modal-input-distance" data-idx="${idx}" value="${link.distanceM}" style="width: 100%; padding: 0.4rem; border: 1px solid var(--border-strong); border-radius: 4px; font-family: inherit; font-size: 0.82rem;" />
                  </div>
                  <div>
                    <label style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 0.2rem;">Intent Medium</label>
                    <select class="modal-select-medium" data-idx="${idx}" style="width: 100%; padding: 0.4rem; border: 1px solid var(--border-strong); border-radius: 4px; font-family: inherit; font-size: 0.82rem;">
                      <option value="auto" ${link.intentMedium === 'auto' ? 'selected' : ''}>auto (Engine Choice)</option>
                      <option value="copper" ${link.intentMedium === 'copper' ? 'selected' : ''}>copper (Cat6a)</option>
                      <option value="fiber" ${link.intentMedium === 'fiber' ? 'selected' : ''}>fiber (MMF/SMF)</option>
                    </select>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary btn-sm" id="btn-cancel-modal">Cancel</button>
          <button class="btn btn-primary btn-sm" id="btn-save-modal">Apply Overrides</button>
        </div>
      </div>
    </div>
  `;

  const close = () => { modalContainer.innerHTML = ''; };
  modalContainer.querySelector('#btn-close-modal').addEventListener('click', close);
  modalContainer.querySelector('#btn-cancel-modal').addEventListener('click', close);

  modalContainer.querySelector('#btn-save-modal').addEventListener('click', () => {
    modalContainer.querySelectorAll('.modal-input-distance').forEach(input => {
      const idx = parseInt(input.getAttribute('data-idx'), 10);
      links[idx].distanceM = Number(input.value);
    });
    modalContainer.querySelectorAll('.modal-select-medium').forEach(select => {
      const idx = parseInt(select.getAttribute('data-idx'), 10);
      links[idx].intentMedium = select.value;
      links[idx].requestedMedium = select.value;
    });
    close();
    renderScenarioConfig(container, state);
  });
}

