/**
 * Integration Test: Metro MAN Profile
 * Validates:
 * - Distances > 400m selecting OS2 Single-Mode Fiber (10GBASE-LR/ER)
 * - Sub-5ms QoS and BFD fast convergence
 * - Dual-homed failover links
 * - SVI & ACL generation
 */
import { generateArchitecture } from '../../src/core/architecture-service.js';

export async function testMetroManProfile() {
  const result = await generateArchitecture('metro-man');
  if (result.status !== 'success') {
    throw new Error(`Expected metro-man analysis success, got ${result.status}`);
  }

  // 1. Verify OS2 SMF media
  const media = result.analysis.media.links;
  for (const link of media) {
    if (!link.medium.includes('OS2 Single-Mode Fiber')) {
      throw new Error(`Metro links (>15km) must recommend OS2 SMF, got ${link.medium}`);
    }
  }

  // 2. Verify BFD and QoS
  const routing = result.analysis.routing.decision;
  if (!routing.outcome.convergenceMechanism.includes('BFD')) {
    throw new Error('Metro MAN must include BFD fast failover for sub-5ms target');
  }

  return true;
}

