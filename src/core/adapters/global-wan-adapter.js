/**
 * Global WAN Profile Adapter
 * Maps raw global WAN scenario to Common Network Model
 */
import { NetworkModel } from '../model/network-model.js';

export function adaptGlobalScenario(raw) {
  if (!raw || raw.profileId !== 'global-wan') {
    throw new Error('Adapter expected global-wan profile');
  }

  const p = raw.parameters || {};

  return new NetworkModel({
    schemaVersion: raw.schemaVersion || '1.0',
    profileId: 'global-wan',
    displayName: raw.displayName || 'Profile 3: Global WAN',
    scope: raw.scope || '4 Cities + Cloud VPC, 2,000 IoT / scanners',
    description: raw.description,
    sites: p.sites || [],
    devices: p.devices || [],
    links: p.links || [],
    endpointGroups: [
      { id: 'ep-iot', name: 'Global IoT & Barcode Scanners', count: 1100, type: 'iot' },
      { id: 'ep-corp', name: 'Corporate Regional Staff', count: 550, type: 'workstation' },
      { id: 'ep-cloud', name: 'AWS Cloud Microservices', count: 250, type: 'cloud-vm' },
      { id: 'ep-wan-p2p', name: 'WAN Link Interconnects', count: 100, type: 'wan-router' }
    ],
    addressing: p.addressing || {
      rootPrefix: '10.0.0.0/14',
      subnetRequests: []
    },
    switching: p.switching || {},
    routing: p.routing || {},
    security: p.security || {},
    resiliency: p.resiliency || {},
    assumptions: [
      {
        id: 'asm-wan-1',
        domain: 'routing-architecture',
        text: 'Multi-Area OSPF is employed internally (Area 0 Backbone, Area 1 EMEA, Area 2 APAC) with route summarization at ABRs to prevent routing churn.'
      },
      {
        id: 'asm-wan-2',
        domain: 'cloud-peering',
        text: 'eBGP peers between Enterprise AS 65000 and AWS Cloud Transit Gateway AS 64512 over Direct Connect with IPsec crypto backup.'
      }
    ]
  });
}

