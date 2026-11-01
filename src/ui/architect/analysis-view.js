/**
 * Architect Workflow: Stage C — Analysis Results
 * Complies with Frontend Contract FE-001 Section 3.2 Stage C
 */
import { formatDistance, formatBandwidth } from '../../utils/units.js';

export function renderAnalysisResults(container, state) {
  const result = state.analysisResult;
  if (!result || result.status !== 'success') {
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem 1rem;">
        <h2 style="font-size: 1.25rem; font-weight: 700; color: #dc2626;">Analysis Not Available or Failed</h2>
        <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 0.5rem;">
          Please review parameters or check the Diagnostics tab for blocking errors.
        </p>
        <button class="btn btn-secondary btn-sm" id="btn-back-to-review" style="margin-top: 1rem;">
          ← Return to Parameter Review
        </button>
      </div>
    `;
    container.querySelector('#btn-back-to-review')?.addEventListener('click', () => {
      state.setStage('review');
    });
    return;
  }

  const analysis = result.analysis;
  const vlsm = analysis.addressing;
  const media = analysis.media?.links || [];
  const configs = result.configurations || [];
  const decisions = result.decisions || [];

  let currentSubTab = state.currentResultsSubTab || 'overview';
  let activeConfigDeviceIndex = 0;

  function updateView() {
    container.innerHTML = `
      <!-- Header -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
        <div>
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
            <span class="badge badge-neutral" style="font-family: var(--font-mono);">${result.profileId}</span>
            <span class="badge badge-info">Execution: ${result.executionTimeMs}ms</span>
            <span class="badge badge-info">Decisions: ${decisions.length}</span>
          </div>
          <h1 style="font-size: 1.5rem; font-weight: 800; letter-spacing: -0.02em;">Architecture Recommendations & Validated Blueprint</h1>
          <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 0.25rem;">
            Self-explaining network architecture, bitwise VLSM allocation, and verified Cisco IOS configurations.
          </p>
        </div>

        <div style="display: flex; gap: 0.5rem;">
          <button class="btn btn-secondary btn-sm" id="btn-back-review">
            ← Edit Parameters
          </button>
          <button class="btn btn-primary btn-sm" id="btn-proceed-export">
            Proceed to Export Center →
          </button>
        </div>
      </div>

      <!-- Quick KPI Stats Bar -->
      <div class="results-stats-bar">
        <div class="stat-box">
          <div class="stat-label">Network Devices</div>
          <div class="stat-value">${result.inputSummary?.devicesCount || 0}</div>
          <div class="stat-hint">Core, Dist & Edge nodes</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Subnets Allocated</div>
          <div class="stat-value">${vlsm.allocations?.length || 0}</div>
          <div class="stat-hint">Zero bitwise overlap</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Host Efficiency</div>
          <div class="stat-value">${vlsm.efficiencyPct}%</div>
          <div class="stat-hint">${vlsm.totalRequestedHosts} / ${vlsm.totalAllocatedIps} IPs utilized</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Routing Protocol</div>
          <div class="stat-value" style="font-size: 1.15rem; margin-top: 0.5rem;">${analysis.routing?.decision?.outcome?.protocol || 'OSPFv2'}</div>
          <div class="stat-hint">Link-state convergence</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Physical Links</div>
          <div class="stat-value">${media.length}</div>
          <div class="stat-hint">IEEE 802.3 compliant</div>
        </div>
      </div>

      <!-- Result Sub-Tabs Navigation -->
      <div class="result-tabs-nav">
        <button class="result-tab-item ${currentSubTab === 'overview' ? 'active' : ''}" data-tab="overview">
          🌐 Overview & Topology
        </button>
        <button class="result-tab-item ${currentSubTab === 'media' ? 'active' : ''}" data-tab="media">
          🔌 Physical Media & Optics
        </button>
        <button class="result-tab-item ${currentSubTab === 'vlsm' ? 'active' : ''}" data-tab="vlsm">
          🔢 IP Addressing & VLSM
        </button>
        <button class="result-tab-item ${currentSubTab === 'routing' ? 'active' : ''}" data-tab="routing">
          📡 Routing & Protocols
        </button>
        <button class="result-tab-item ${currentSubTab === 'security' ? 'active' : ''}" data-tab="security">
          🛡️ Switching & Security
        </button>
        <button class="result-tab-item ${currentSubTab === 'configs' ? 'active' : ''}" data-tab="configs">
          💻 Cisco IOS Configurations (${configs.length})
        </button>
        <button class="result-tab-item ${currentSubTab === 'decisions' ? 'active' : ''}" data-tab="decisions">
          🧠 Decision Trace (${decisions.length})
        </button>
      </div>

      <!-- Tab Content Area -->
      <div id="subtab-content" style="margin-top: 1rem;">
        ${renderSubTabContent(currentSubTab, result, analysis, activeConfigDeviceIndex)}
      </div>
    `;

    // Attach sub-tab switches
    container.querySelectorAll('.result-tab-item').forEach(btn => {
      btn.addEventListener('click', () => {
        currentSubTab = btn.getAttribute('data-tab');
        state.currentResultsSubTab = currentSubTab;
        updateView();
      });
    });

    // Navigation buttons
    container.querySelector('#btn-back-review')?.addEventListener('click', () => {
      state.setStage('review');
    });

    container.querySelector('#btn-proceed-export')?.addEventListener('click', () => {
      state.setStage('export');
    });

    // Device config selector
    const deviceSelect = container.querySelector('#select-config-device');
    if (deviceSelect) {
      deviceSelect.addEventListener('change', (e) => {
        activeConfigDeviceIndex = parseInt(e.target.value, 10);
        updateView();
      });
    }

    // Copy config button
    const copyBtn = container.querySelector('#btn-copy-config');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const activeCfg = configs[activeConfigDeviceIndex]?.content || '';
        navigator.clipboard.writeText(activeCfg).then(() => {
          copyBtn.textContent = '✓ Copied to Clipboard!';
          setTimeout(() => { copyBtn.textContent = '📋 Copy Config'; }, 2000);
        });
      });
    }
  }

  updateView();
}

function renderSubTabContent(tab, result, analysis, activeConfigIndex) {
  switch (tab) {
    case 'overview':
      return renderOverviewTab(result, analysis);
    case 'media':
      return renderMediaTab(analysis.media?.links || []);
    case 'vlsm':
      return renderVlsmTab(analysis.addressing);
    case 'routing':
      return renderRoutingTab(analysis.routing);
    case 'security':
      return renderSecurityTab(analysis.switching, analysis.security);
    case 'configs':
      return renderConfigsTab(result.configurations || [], activeConfigIndex);
    case 'decisions':
      return renderDecisionsTab(result.decisions || []);
    default:
      return '';
  }
}

/**
 * 1. Overview & Visual SVG Topology
 */
function renderOverviewTab(result, analysis) {
  const sites = analysis.topology?.sites || [];
  const devices = analysis.topology?.devices || [];
  const links = analysis.media?.links || [];

  return `
    <div style="display: flex; flex-direction: column; gap: 1.5rem;">
      <div class="panel-card">
        <div class="panel-title">
          <span>Visual Topology Diagram</span>
          <span class="badge badge-neutral">Dynamic SVG Map</span>
        </div>
        <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 1rem;">
          Topology rendering of physical facilities, active network elements, and interconnect spans color-coded by media standard.
        </p>

        <!-- SVG Topology Diagram -->
        <div style="background-color: #f8fafc; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); overflow: hidden; display: flex; justify-content: center; padding: 1.5rem 0;">
          <svg width="780" height="340" viewBox="0 0 780 340" style="max-width: 100%; height: auto;">
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
              </marker>
            </defs>

            <!-- Sites Containers (Campus / MAN / WAN) -->
            ${sites.map((site, idx) => {
              const x = 50 + idx * 240;
              const y = 40;
              return `
                <rect x="${x}" y="${y}" width="200" height="250" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="4" />
                <text x="${x + 12}" y="${y + 24}" font-family="system-ui" font-size="12" font-weight="700" fill="#0f172a">
                  ${site.name.length > 22 ? site.name.substring(0, 22) + '...' : site.name}
                </text>
                <text x="${x + 12}" y="${y + 40}" font-family="system-ui" font-size="10" fill="#64748b">
                  Role: ${site.role || 'Site'}
                </text>
              `;
            }).join('')}

            <!-- Device Nodes -->
            ${devices.map((dev, idx) => {
              const siteIdx = sites.findIndex(s => s.id === dev.siteId);
              const col = siteIdx >= 0 ? siteIdx : (idx % 3);
              const rowInSite = Math.floor(idx / 3);
              const cx = 150 + col * 240;
              const cy = 120 + (idx % 2) * 90;
              const isSwitch = dev.role.includes('switch');

              return `
                <g>
                  <circle cx="${cx}" cy="${cy}" r="22" fill="${isSwitch ? '#1e293b' : '#0f766e'}" stroke="#ffffff" stroke-width="2" />
                  <text x="${cx}" y="${cy + 4}" font-family="monospace" font-size="9" font-weight="700" fill="#ffffff" text-anchor="middle">
                    ${isSwitch ? 'SW' : 'RTR'}
                  </text>
                  <text x="${cx}" y="${cy + 34}" font-family="system-ui" font-size="10" font-weight="600" fill="#0f172a" text-anchor="middle">
                    ${dev.name}
                  </text>
                </g>
              `;
            }).join('')}

            <!-- Connections Line Key -->
            <g transform="translate(20, 310)">
              <line x1="0" y1="10" x2="30" y2="10" stroke="#0284c7" stroke-width="3" />
              <text x="36" y="14" font-family="system-ui" font-size="10" fill="#334155">Cat6a Copper (≤100m)</text>
              <line x1="180" y1="10" x2="210" y2="10" stroke="#16a34a" stroke-width="3" />
              <text x="216" y="14" font-family="system-ui" font-size="10" fill="#334155">OM4 MMF (101–400m)</text>
              <line x1="370" y1="10" x2="400" y2="10" stroke="#d97706" stroke-width="3" />
              <text x="406" y="14" font-family="system-ui" font-size="10" fill="#334155">OS2 SMF (>400m)</text>
            </g>
          </svg>
        </div>
      </div>

      <!-- Architectural Summary Statement -->
      <div class="panel-card">
        <div class="panel-title">
          <span>Executive Architectural Rationale</span>
        </div>
        <p style="font-size: 0.88rem; line-height: 1.6; color: var(--text-main);">
          The design implements an end-to-end resilient architecture tailored to <strong>${result.displayName}</strong>.
          Media selection strictly honors IEEE 802.3 channel length and modal dispersion parameters.
          The subnet hierarchy incorporates Classless Inter-Domain Routing (CIDR RFC 4632) and Variable Length Subnet Masking (RFC 1878) to deliver <strong>${analysis.addressing?.efficiencyPct}%</strong> address space utilization efficiency.
          Routing convergence is established via <strong>${analysis.routing?.decision?.outcome?.protocol}</strong>, achieving sub-second failover.
        </p>
      </div>
    </div>
  `;
}

/**
 * 2. Physical Media & Optics Table
 */
function renderMediaTab(links) {
  return `
    <div class="panel-card">
      <div class="panel-title">
        <span>Physical Layer (L1) Media & Transceiver Recommendations</span>
        <span class="badge badge-neutral">${links.length} Evaluated Links</span>
      </div>
      <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 1rem;">
        Media choices programmatically derived from physical distance runs, attenuation curves, and optical link budgets.
      </p>

      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Link Name</th>
              <th>Physical Distance</th>
              <th>Recommended Medium</th>
              <th>Standard / PHY</th>
              <th>Optics Transceiver</th>
              <th>Engineering Justification</th>
            </tr>
          </thead>
          <tbody>
            ${links.map(l => {
              let badgeColor = 'badge-neutral';
              if (l.medium.includes('Copper')) badgeColor = 'badge-info';
              else if (l.medium.includes('OM4')) badgeColor = 'badge-info';
              else badgeColor = 'badge-warning';

              return `
                <tr>
                  <td style="font-weight: 700;">${l.linkName}</td>
                  <td style="font-weight: 800; font-size: 0.88rem;">${l.formattedDistance}</td>
                  <td><span class="badge ${badgeColor}">${l.medium}</span></td>
                  <td class="code-font" style="font-weight: 600;">${l.technology}</td>
                  <td class="code-font" style="color: var(--text-muted);">${l.transceiver}</td>
                  <td style="font-size: 0.8rem; line-height: 1.45; color: var(--text-muted); max-width: 380px;">
                    ${l.explanation}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/**
 * 3. IP Addressing & VLSM Table
 */
function renderVlsmTab(vlsm) {
  const allocs = vlsm.allocations || [];

  return `
    <div style="display: flex; flex-direction: column; gap: 1.5rem;">
      <div class="panel-card">
        <div class="panel-title">
          <span>Variable Length Subnet Mask (VLSM) Allocation Table</span>
          <span class="badge badge-info">Root: ${vlsm.rootCidr}</span>
        </div>
        <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 1rem;">
          ${vlsm.rationale}
        </p>

        <div class="data-table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Subnet Name</th>
                <th>VLAN</th>
                <th>CIDR Subnet</th>
                <th>Subnet Mask</th>
                <th>Wildcard Mask</th>
                <th>Usable Host Range</th>
                <th>Broadcast Address</th>
                <th>Capacity</th>
                <th>Efficiency</th>
              </tr>
            </thead>
            <tbody>
              ${allocs.map(sub => `
                <tr>
                  <td style="font-weight: 700;">${sub.name}</td>
                  <td><span class="badge badge-neutral">${sub.vlanId || '—'}</span></td>
                  <td class="code-font" style="font-weight: 800; color: #000;">${sub.cidr}</td>
                  <td class="code-font">${sub.netmask}</td>
                  <td class="code-font">${sub.wildcardMask}</td>
                  <td class="code-font" style="font-size: 0.75rem;">${sub.firstUsable} – ${sub.lastUsable}</td>
                  <td class="code-font">${sub.broadcastAddress}</td>
                  <td><strong>${sub.hostsRequested}</strong> / ${sub.usableHosts}</td>
                  <td>
                    <div style="display: flex; align-items: center; gap: 0.4rem;">
                      <div style="flex: 1; height: 6px; width: 60px; background-color: #e2e8f0; border-radius: 999px; overflow: hidden;">
                        <div style="height: 100%; width: ${Math.min(sub.hostUtilizationPct, 100)}%; background-color: #000;"></div>
                      </div>
                      <span style="font-size: 0.72rem; font-weight: 600;">${sub.hostUtilizationPct}%</span>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

/**
 * 4. Routing & Protocols
 */
function renderRoutingTab(routing) {
  const d = routing.decision?.outcome || {};
  return `
    <div class="panel-card">
      <div class="panel-title">
        <span>Layer 3 Dynamic Routing Design</span>
        <span class="badge badge-neutral">${d.protocol || d.igpProtocol || 'OSPF'}</span>
      </div>
      <div style="margin-bottom: 1rem; font-size: 0.88rem; line-height: 1.6;">
        <p><strong>Convergence Mechanism:</strong> ${d.convergenceMechanism || 'Link-State SPF (Dijkstra)'}</p>
        <p><strong>Topology Design:</strong> ${d.topologyScope || d.igpProtocol || 'Backbone'}</p>
        ${d.egpProtocol ? `<p><strong>Exterior Peering:</strong> ${d.egpProtocol}</p>` : ''}
        ${d.summarization ? `<p><strong>Route Summarization:</strong> ${d.summarization}</p>` : ''}
      </div>

      <div style="background-color: var(--bg-card-subtle); padding: 1rem; border-radius: var(--radius-md); font-size: 0.85rem; line-height: 1.6;">
        <strong>Architectural Rationale:</strong><br />
        ${routing.decision?.explanation || 'Optimal routing protocol selected based on subnet scale and boundary domains.'}
      </div>
    </div>
  `;
}

/**
 * 5. Switching & Security
 */
function renderSecurityTab(switching, security) {
  return `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 1.5rem;">
      <div class="panel-card">
        <div class="panel-title">
          <span>Layer 2 Switching & STP</span>
        </div>
        <p style="font-size: 0.85rem; line-height: 1.6;">
          <strong>VLAN Encapsulation:</strong> ${switching.decision?.outcome?.vlanStandard || 'IEEE 802.1Q'}<br />
          <strong>Spanning Tree Protocol:</strong> ${switching.decision?.outcome?.spanningTreeProtocol || 'Rapid-PVST+ (IEEE 802.1w)'}<br />
          <strong>Edge Protection:</strong> ${switching.decision?.outcome?.portSecurity || 'BPDU Guard & PortFast Enabled'}
        </p>
        <div style="margin-top: 1rem; background-color: var(--bg-card-subtle); padding: 0.75rem; border-radius: var(--radius-sm); font-size: 0.82rem;">
          ${switching.decision?.explanation}
        </div>
      </div>

      <div class="panel-card">
        <div class="panel-title">
          <span>Network Security & ACL Policy</span>
        </div>
        <p style="font-size: 0.85rem; line-height: 1.6;">
          <strong>Filtering Engine:</strong> ${security.decision?.outcome?.firewallAcl || security.decision?.outcome?.vpnProtocol || 'Extended ACLs'}<br />
          <strong>Isolation Rule:</strong> ${security.decision?.outcome?.rulesSummary || security.decision?.outcome?.iotIsolation || 'Zero-Trust SVI Enforcement'}
        </p>
        <div style="margin-top: 1rem; background-color: var(--bg-card-subtle); padding: 0.75rem; border-radius: var(--radius-sm); font-size: 0.82rem;">
          ${security.decision?.explanation}
        </div>
      </div>
    </div>
  `;
}

/**
 * 6. Cisco IOS Configurations with Copy & Select
 */
function renderConfigsTab(configs, activeIndex) {
  if (configs.length === 0) {
    return `<div class="panel-card"><p>No configurations generated.</p></div>`;
  }

  const active = configs[activeIndex] || configs[0];

  return `
    <div class="panel-card">
      <div class="config-header-bar">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <label style="font-size: 0.82rem; font-weight: 700; color: var(--text-main);">Target Network Device:</label>
          <select id="select-config-device" style="padding: 0.35rem 0.6rem; border: 1px solid var(--border-strong); border-radius: 4px; font-family: inherit; font-size: 0.82rem; font-weight: 600;">
            ${configs.map((c, idx) => `
              <option value="${idx}" ${idx === activeIndex ? 'selected' : ''}>${c.deviceName} (${c.role} — ${c.platform})</option>
            `).join('')}
          </select>
        </div>

        <button class="btn btn-primary btn-sm" id="btn-copy-config">
          📋 Copy Config
        </button>
      </div>

      <pre class="config-preview-container"><code>${escapeHtml(active.content)}</code></pre>
    </div>
  `;
}

/**
 * 7. Decision Trace & Explainability
 */
function renderDecisionsTab(decisions) {
  return `
    <div style="display: flex; flex-direction: column; gap: 1rem;">
      ${decisions.map(d => `
        <div class="decision-card">
          <div class="decision-card-top">
            <span class="decision-rule-id">${d.rule?.id || 'RULE_ID'}</span>
            <span class="badge badge-neutral" style="text-transform: capitalize;">${d.domain}</span>
          </div>
          <div style="font-weight: 700; font-size: 0.92rem; color: #000;">
            Subject: ${d.subjectId || 'System'}
          </div>
          <p class="decision-explanation">
            "${d.explanation}"
          </p>
          <div class="decision-meta">
            ${(d.standards || []).map(s => `<span class="badge badge-info" style="font-size: 0.7rem;">${s}</span>`).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

