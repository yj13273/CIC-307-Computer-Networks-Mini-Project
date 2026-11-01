/**
 * Architect Workflow: Stage D — Export Center
 * Complies with Frontend Contract FE-001 Section 3.2 Stage D
 */
import { saveSession } from '../sessions/session-storage.js';

export function renderExportView(container, state) {
  const result = state.analysisResult;
  if (!result || result.status !== 'success') {
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem 1rem;">
        <h2 style="font-size: 1.25rem; font-weight: 700; color: #dc2626;">No Analysis Results to Export</h2>
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

  const configs = result.configurations || [];
  const vlsm = result.analysis?.addressing;
  const decisions = result.decisions || [];

  container.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
      <div>
        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
          <span class="badge badge-neutral" style="font-family: var(--font-mono);">${result.profileId}</span>
          <span class="badge badge-info">Verified Configurations</span>
        </div>
        <h1 style="font-size: 1.5rem; font-weight: 800; letter-spacing: -0.02em;">Export Artifacts & Save Session</h1>
        <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 0.25rem;">
          Download deployment-ready Cisco IOS scripts, VLSM addressing sheets (CSV), architectural decision reports, and archive this session.
        </p>
      </div>

      <button class="btn btn-secondary btn-sm" id="btn-back-results">
        ← Back to Results View
      </button>
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 1.5rem; margin-bottom: 1.5rem;">
      <!-- Card 1: Cisco Configurations -->
      <div class="panel-card">
        <div class="panel-title">
          <span>1. Cisco IOS Configuration Scripts</span>
          <span class="badge badge-neutral">${configs.length} Devices</span>
        </div>
        <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 1rem;">
          Packet Tracer / GNS3 copy-paste ready configurations with VLANs, OSPF, and ACLs.
        </p>

        <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.25rem;">
          ${configs.map((c, idx) => `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.4rem 0.6rem; background: var(--bg-card-subtle); border-radius: var(--radius-sm); font-size: 0.8rem;">
              <span class="code-font" style="font-weight: 600;">${c.filename}</span>
              <button class="btn btn-secondary btn-sm btn-download-cfg" data-idx="${idx}">
                Download .cfg
              </button>
            </div>
          `).join('')}
        </div>

        <button class="btn btn-primary" id="btn-download-all-configs" style="width: 100%;">
          📦 Download Complete Network Config Bundle
        </button>
      </div>

      <!-- Card 2: VLSM Addressing Spreadsheet -->
      <div class="panel-card">
        <div class="panel-title">
          <span>2. IP Addressing & Subnet Spreadsheet</span>
          <span class="badge badge-info">CSV Format</span>
        </div>
        <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 1rem;">
          Export non-overlapping subnet allocations with usable gateways, broadcast addresses, and netmasks for network documentation.
        </p>

        <div style="background-color: var(--bg-card-subtle); padding: 1rem; border-radius: var(--radius-sm); font-size: 0.82rem; margin-bottom: 1.25rem;">
          <div>Root IPv4 Prefix: <strong class="code-font">${vlsm.rootCidr}</strong></div>
          <div>Total Subnets: <strong>${vlsm.allocations?.length || 0}</strong></div>
          <div>Host Packing Efficiency: <strong>${vlsm.efficiencyPct}%</strong></div>
        </div>

        <button class="btn btn-secondary" id="btn-export-csv" style="width: 100%;">
          📊 Export Subnets Allocation (.CSV)
        </button>
      </div>

      <!-- Card 3: Architectural Decision Report -->
      <div class="panel-card">
        <div class="panel-title">
          <span>3. Architectural Decision Report</span>
          <span class="badge badge-neutral">Markdown / JSON</span>
        </div>
        <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 1rem;">
          Self-explaining engineering report documenting rule-based rationales, standards references, and design justifications.
        </p>

        <div style="background-color: var(--bg-card-subtle); padding: 1rem; border-radius: var(--radius-sm); font-size: 0.82rem; margin-bottom: 1.25rem;">
          <div>Decision Records: <strong>${decisions.length} engineering rules</strong></div>
          <div>Standards Referenced: <strong>IEEE 802.3, RFC 2328, RFC 4632</strong></div>
        </div>

        <div style="display: flex; gap: 0.5rem;">
          <button class="btn btn-secondary" id="btn-export-md" style="flex: 1;">
            📄 Report (.MD)
          </button>
          <button class="btn btn-secondary" id="btn-export-json" style="flex: 1;">
            💾 Result (.JSON)
          </button>
        </div>
      </div>

      <!-- Card 4: Persistent Session Archival -->
      <div class="panel-card">
        <div class="panel-title">
          <span>4. Session History Archival</span>
          <span class="badge badge-neutral">IndexedDB</span>
        </div>
        <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 1rem;">
          Save this complete architecture state into browser local persistent storage. You can restore, rename, or compare sessions later.
        </p>

        <div style="margin-bottom: 1rem;">
          <label style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">Session Name</label>
          <input type="text" id="input-session-name" value="${result.displayName} — Design ${new Date().toLocaleTimeString()}" style="width: 100%; padding: 0.45rem; border: 1px solid var(--border-strong); border-radius: 4px; font-family: inherit; font-size: 0.82rem;" />
        </div>

        <button class="btn btn-primary" id="btn-save-session" style="width: 100%;">
          💾 Save Session to History
        </button>
        <div id="save-status-msg" style="font-size: 0.78rem; margin-top: 0.5rem; text-align: center; color: #166534; display: none;">
          ✓ Session successfully persisted to IndexedDB!
        </div>
      </div>
    </div>
  `;

  // Attach downloads
  container.querySelector('#btn-back-results').addEventListener('click', () => {
    state.setStage('results');
  });

  // Individual config download
  container.querySelectorAll('.btn-download-cfg').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-idx'), 10);
      const cfg = configs[idx];
      downloadFile(cfg.filename, cfg.content, 'text/plain');
    });
  });

  // Combined bundle
  container.querySelector('#btn-download-all-configs').addEventListener('click', () => {
    let combined = `! ========================================================\n! NETARCHITECT COMPLETE CISCO CONFIGURATION BUNDLE\n! Profile: ${result.displayName}\n! Generated: ${new Date().toISOString()}\n! ========================================================\n\n`;
    for (const c of configs) {
      combined += `\n! >>>>>>>>>>>>>>>>>> DEVICE: ${c.deviceName} (${c.filename}) <<<<<<<<<<<<<<<<<<\n\n`;
      combined += c.content;
      combined += '\n\n';
    }
    downloadFile(`${result.profileId}_cisco_bundle.txt`, combined, 'text/plain');
  });

  // CSV Subnets
  container.querySelector('#btn-export-csv').addEventListener('click', () => {
    const allocs = vlsm.allocations || [];
    let csv = 'Subnet Name,VLAN ID,CIDR,Network Address,Prefix,Subnet Mask,Wildcard Mask,First Usable,Last Usable,Broadcast Address,Hosts Requested,Capacity,Efficiency Pct\n';
    for (const s of allocs) {
      csv += `"${s.name}","${s.vlanId || ''}","${s.cidr}","${s.networkAddress}","/${s.prefix}","${s.netmask}","${s.wildcardMask}","${s.firstUsable}","${s.lastUsable}","${s.broadcastAddress}",${s.hostsRequested},${s.usableHosts},${s.hostUtilizationPct}%\n`;
    }
    downloadFile(`${result.profileId}_subnets.csv`, csv, 'text/csv');
  });

  // MD Report
  container.querySelector('#btn-export-md').addEventListener('click', () => {
    let md = `# NetArchitect Architecture Report: ${result.displayName}\n\n`;
    md += `**Profile:** ${result.profileId}  \n**Scope:** ${result.scope}  \n**Date:** ${new Date().toISOString()}  \n\n`;
    md += `## 1. Physical Media Recommendations\n\n`;
    md += `| Link | Distance | Medium | Standard | Transceiver |\n|---|---|---|---|---|\n`;
    for (const l of result.analysis?.media?.links || []) {
      md += `| ${l.linkName} | ${l.formattedDistance} | ${l.medium} | ${l.technology} | ${l.transceiver} |\n`;
    }
    md += `\n## 2. Subnet Allocation (VLSM)\n\n`;
    md += `Root prefix: \`${vlsm.rootCidr}\` | Overall Host Efficiency: **${vlsm.efficiencyPct}%**\n\n`;
    md += `| Subnet | VLAN | CIDR | Usable Range | Netmask | Wildcard |\n|---|---|---|---|---|---|\n`;
    for (const s of vlsm.allocations || []) {
      md += `| ${s.name} | ${s.vlanId || '—'} | \`${s.cidr}\` | \`${s.firstUsable} – ${s.lastUsable}\` | \`${s.netmask}\` | \`${s.wildcardMask}\` |\n`;
    }
    md += `\n## 3. Algorithmic Decision Explanations\n\n`;
    for (const d of decisions) {
      md += `### Rule: ${d.rule?.id}\n- **Subject:** ${d.subjectId}\n- **Explanation:** ${d.explanation}\n- **Standards:** ${(d.standards || []).join(', ')}\n\n`;
    }
    downloadFile(`${result.profileId}_architecture_report.md`, md, 'text/markdown');
  });

  // JSON Export
  container.querySelector('#btn-export-json').addEventListener('click', () => {
    const jsonStr = JSON.stringify(result, null, 2);
    downloadFile(`${result.profileId}_architecture_result.json`, jsonStr, 'application/json');
  });

  // Save Session
  container.querySelector('#btn-save-session').addEventListener('click', async () => {
    const nameInput = container.querySelector('#input-session-name');
    const msg = container.querySelector('#save-status-msg');

    const sessionObj = {
      id: `sess-${Date.now()}`,
      name: nameInput.value.trim() || `${result.displayName} Session`,
      scenarioId: result.profileId,
      scenarioVersion: '1.0',
      originalScenario: state.currentScenario,
      analysisResult: result,
      summary: {
        devices: configs.length,
        subnets: vlsm.allocations?.length || 0,
        efficiencyPct: vlsm.efficiencyPct
      }
    };

    await saveSession(sessionObj);
    if (msg) {
      msg.style.display = 'block';
      setTimeout(() => { msg.style.display = 'none'; }, 4000);
    }
  });
}

function downloadFile(filename, text, mimeType) {
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

