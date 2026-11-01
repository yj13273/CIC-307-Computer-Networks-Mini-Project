/**
 * Campus LAN Profile Adapter
 * Maps raw campus scenario to Common Network Model
 */
import { NetworkModel } from '../model/network-model.js';

export function adaptCampusScenario(raw) {
  if (!raw || raw.profileId !== 'campus-lan') {
    throw new Error('Adapter expected campus-lan profile');
  }

  const p = raw.parameters || {};

  return new NetworkModel({
    schemaVersion: raw.schemaVersion || '1.0',
    profileId: 'campus-lan',
    displayName: raw.displayName || 'Profile 1: Campus LAN',
    scope: raw.scope || '3 Buildings, <400m, 1,600 endpoints, PoE APs',
    description: raw.description,
    sites: p.sites || [],
    devices: p.devices || [],
    links: p.links || [],
    endpointGroups: [
      { id: 'ep-students', name: 'Student BYOD', count: 850, type: 'wireless' },
      { id: 'ep-faculty', name: 'Faculty Staff', count: 350, type: 'desktop' },
      { id: 'ep-labs', name: 'Engineering Labs', count: 220, type: 'workstation' },
      { id: 'ep-voip', name: 'IP Phones', count: 120, type: 'voip' },
      { id: 'ep-aps', name: 'Wi-Fi 6 APs', count: 60, type: 'poe-ap' }
    ],
    addressing: p.addressing || {
      rootPrefix: '10.10.0.0/16',
      subnetRequests: []
    },
    switching: p.switching || {},
    routing: p.routing || {},
    security: p.security || {},
    resiliency: p.resiliency || {},
    assumptions: [
      {
        id: 'asm-camp-1',
        domain: 'physical-media',
        text: 'Inter-building cable runs between Buildings 1 and 2 (240m) and Buildings 1 and 3 (320m) use OM4 MMF multi-fiber underground conduit.'
      },
      {
        id: 'asm-camp-2',
        domain: 'l2-switching',
        text: 'Access switches deliver IEEE 802.3bt Type 4 PoE++ power to all Wi-Fi 6 APs.'
      }
    ]
  });
}

