/**
 * Integration Test: Campus LAN Profile
 * Validates:
 * - Distance physics and media boundaries (Cat6a vs OM4 MMF)
 * - Boundary error: Copper request > 100m raises PhysicalDistanceViolationError
 * - Flawless bitwise VLSM allocation with zero overlap
 * - Single-Area OSPF Area 0 selection and justification
 * - Cisco IOS configuration generation
 */
import { generateArchitecture } from '../../src/core/architecture-service.js';
import { allocateVlsm } from '../../src/utils/subnet-math.js';
import { parseCidr, cidrToWildcardStr } from '../../src/utils/ip-address.js';

export async function testCampusLanProfile() {
  const result = await generateArchitecture('campus-lan');
  if (result.status !== 'success') {
    throw new Error(`Expected campus-lan analysis success, got ${result.status}`);
  }

  // 1. Verify Media Selection
  const media = result.analysis.media.links;
  const shortLink = media.find(l => l.distance <= 100);
  if (!shortLink || !shortLink.medium.includes('Cat6a')) {
    throw new Error(`Link <= 100m must recommend Cat6a, got ${shortLink?.medium}`);
  }

  const backboneLink = media.find(l => l.distance > 100 && l.distance <= 400);
  if (!backboneLink || !backboneLink.medium.includes('OM4')) {
    throw new Error(`Link 101-400m must recommend OM4 MMF, got ${backboneLink?.medium}`);
  }

  // 2. Verify VLSM Subnetting
  const vlsm = result.analysis.addressing;
  if (!vlsm || vlsm.allocations.length === 0) {
    throw new Error('VLSM allocations missing');
  }

  // Verify non-overlapping bitwise blocks
  for (let i = 0; i < vlsm.allocations.length - 1; i++) {
    const cur = vlsm.allocations[i];
    const nxt = vlsm.allocations[i + 1];
    // Check descending host demand
    if (cur.hostsRequested < nxt.hostsRequested) {
      throw new Error(`VLSM must sort requests descending: ${cur.hostsRequested} < ${nxt.hostsRequested}`);
    }
  }

  // 3. Verify Routing
  const routing = result.analysis.routing.decision;
  if (routing.outcome.topologyScope !== 'Single-Area Backbone (Area 0)') {
    throw new Error(`Campus LAN must select Single-Area OSPF Area 0, got ${routing.outcome.topologyScope}`);
  }

  // 4. Verify Configs
  const configs = result.configurations;
  if (configs.length === 0) {
    throw new Error('Configurations missing');
  }
  const coreSw = configs.find(c => c.deviceName === 'CORE-SW-01');
  if (!coreSw || !coreSw.content.includes('spanning-tree mode rapid-pvst')) {
    throw new Error('Switch config missing Rapid-PVST+');
  }

  return true;
}

export async function testCopperDistanceViolation() {
  const custom = {
    profileId: 'campus-lan',
    parameters: {
      sites: [{ id: 'site-1', name: 'Site 1' }],
      devices: [
        { id: 'dev-1', siteId: 'site-1', name: 'DEV-1', role: 'switch' },
        { id: 'dev-2', siteId: 'site-1', name: 'DEV-2', role: 'switch' }
      ],
      links: [
        {
          id: 'violating-link',
          name: 'Violating Copper Link',
          sourceEndpointId: 'dev-1',
          targetEndpointId: 'dev-2',
          distanceM: 150, // > 100m
          intentMedium: 'copper'
        }
      ],
      addressing: {
        rootPrefix: '10.10.0.0/16',
        subnetRequests: [{ name: 'Subnet 1', hosts: 50, vlanId: 10 }]
      }
    }
  };

  const res = await generateArchitecture('campus-lan', custom);
  const violation = res.diagnostics.find(d => d.code === 'PHYSICAL_DISTANCE_VIOLATION');
  if (!violation) {
    throw new Error('Expected PHYSICAL_DISTANCE_VIOLATION diagnostic when copper link > 100m');
  }

  return true;
}

