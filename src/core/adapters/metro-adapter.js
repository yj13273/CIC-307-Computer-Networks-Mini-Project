/**
 * Metro MAN Profile Adapter
 * Maps raw metro scenario to Common Network Model
 */
import { NetworkModel } from '../model/network-model.js';

export function adaptMetroScenario(raw) {
  if (!raw || raw.profileId !== 'metro-man') {
    throw new Error('Adapter expected metro-man profile');
  }

  const p = raw.parameters || {};

  return new NetworkModel({
    schemaVersion: raw.schemaVersion || '1.0',
    profileId: 'metro-man',
    displayName: raw.displayName || 'Profile 2: Metro MAN',
    scope: raw.scope || 'HQ + 2 Remote (15–35km), 450 users, FinTech Colo',
    description: raw.description,
    sites: p.sites || [],
    devices: p.devices || [],
    links: p.links || [],
    endpointGroups: [
      { id: 'ep-trading', name: 'Algorithmic Trading', count: 180, type: 'hft-node' },
      { id: 'ep-banking', name: 'Settlement & Core Banking', count: 120, type: 'transactional' },
      { id: 'ep-dr', name: 'DR Database Mirroring', count: 90, type: 'storage' },
      { id: 'ep-mgmt', name: 'Colo Out-of-Band Mgmt', count: 60, type: 'management' }
    ],
    addressing: p.addressing || {
      rootPrefix: '172.16.0.0/16',
      subnetRequests: []
    },
    switching: p.switching || {},
    routing: p.routing || {},
    security: p.security || {},
    resiliency: p.resiliency || {},
    assumptions: [
      {
        id: 'asm-metro-1',
        domain: 'physical-media',
        text: 'All metropolitan links span >15 km and use Carrier Ethernet EVPL over dark OS2 Single-Mode Fiber.'
      },
      {
        id: 'asm-metro-2',
        domain: 'latency-sla',
        text: 'Sub-5ms latency target is enforced through high-priority strict queuing (EF/CoS 5) and BFD fast sub-second link failover.'
      }
    ]
  });
}

