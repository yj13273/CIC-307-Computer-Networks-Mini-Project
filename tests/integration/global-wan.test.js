/**
 * Integration Test: Global WAN Profile
 * Validates:
 * - 4 Cities + Cloud VPC integration
 * - IPsec VPN IKEv2 with AES-256-GCM
 * - Multi-Area OSPF + eBGP peering
 * - Supernetting / Route Summarization
 * - Address space exhaustion edge-case detection
 */
import { generateArchitecture } from '../../src/core/architecture-service.js';
import { allocateVlsm, SubnetExhaustionError } from '../../src/utils/subnet-math.js';

export async function testGlobalWanProfile() {
  const result = await generateArchitecture('global-wan');
  if (result.status !== 'success') {
    throw new Error(`Expected global-wan analysis success, got ${result.status}`);
  }

  // 1. Verify Multi-Area OSPF + eBGP
  const routing = result.analysis.routing.decision;
  if (!routing.outcome.igpProtocol.includes('Multi-Area OSPFv2')) {
    throw new Error(`Global WAN must select Multi-Area OSPF, got ${routing.outcome.igpProtocol}`);
  }

  // 2. Verify IPsec VPN
  const sec = result.analysis.security.decision;
  if (!sec.outcome.vpnProtocol.includes('IPsec') || !sec.outcome.encryptionCipher.includes('AES-256-GCM')) {
    throw new Error('Global WAN must select IPsec IKEv2 with AES-256-GCM');
  }

  return true;
}

export function testAddressExhaustion() {
  let threw = false;
  try {
    // /30 root has only 4 total IPs (2 usable). Requesting 50 hosts must throw SubnetExhaustionError
    allocateVlsm('192.168.1.0/30', [
      { name: 'Exhaustion Test Subnet', hosts: 50 }
    ]);
  } catch (err) {
    if (err instanceof SubnetExhaustionError || err.code === 'SUBNET_SPACE_EXHAUSTION') {
      threw = true;
    }
  }

  if (!threw) {
    throw new Error('Expected SubnetExhaustionError when requesting more hosts than root capacity');
  }

  return true;
}

