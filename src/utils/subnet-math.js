/**
 * Variable Length Subnet Masking (VLSM) and Bitwise Address Allocation
 */
import { ipToInt, intToIp, cidrToNetmaskStr, cidrToWildcardStr, parseCidr } from './ip-address.js';

export class SubnetExhaustionError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'SubnetExhaustionError';
    this.code = 'SUBNET_SPACE_EXHAUSTION';
    this.details = details;
  }
}

/**
 * Calculates prefix length required to support requested number of usable hosts.
 * In standard IPv4:
 * Usable hosts = 2^(32 - prefix) - 2 for prefix <= 30.
 * For /31 (point-to-point RFC 3021), usable hosts = 2 (no network/broadcast).
 * For /32 (host route), usable hosts = 1.
 */
export function calculateRequiredPrefix(usableHostsRequired) {
  if (usableHostsRequired <= 0) {
    throw new Error('Host requirement must be greater than 0');
  }
  if (usableHostsRequired === 1) return 32;
  if (usableHostsRequired === 2) return 30; // Standard Cisco IOS Point-to-Point subnet (or /31 if RFC 3021)

  // Needs at least usableHostsRequired + 2 (1 network address + 1 broadcast address)
  const totalSlotsNeeded = usableHostsRequired + 2;
  const hostBits = Math.ceil(Math.log2(totalSlotsNeeded));
  const prefix = 32 - hostBits;
  if (prefix < 0) {
    throw new Error(`Host request ${usableHostsRequired} exceeds 32-bit IPv4 address space`);
  }
  return prefix;
}

/**
 * Performs dynamic bitwise VLSM allocation:
 * 1. Validates root prefix.
 * 2. Sorts host requests descending.
 * 3. Allocates strictly non-overlapping aligned blocks.
 * 4. Checks against boundary overflow.
 * 5. Computes network address, gateway (first usable), last usable, broadcast, netmask, wildcard.
 * 6. Computes utilization statistics and efficiency rationale.
 */
export function allocateVlsm(rootCidr, requests) {
  const root = parseCidr(rootCidr);
  const rootStartInt = (ipToInt(root.ip) & (cidrToNetmaskInt(root.prefix))) >>> 0;
  const rootTotalIps = Math.pow(2, 32 - root.prefix);
  const rootEndInt = (rootStartInt + rootTotalIps - 1) >>> 0;

  // Validate requests
  if (!Array.isArray(requests) || requests.length === 0) {
    return {
      rootCidr,
      allocations: [],
      totalRequestedHosts: 0,
      totalAllocatedIps: 0,
      rootTotalIps,
      efficiencyPct: 0,
      rationale: 'No subnet requests provided.'
    };
  }

  // Clone and sort descending by host count (VLSM primary rule)
  const sorted = requests
    .map((req, originalIndex) => ({
      id: req.id || `subnet-${originalIndex + 1}`,
      name: req.name || `Subnet ${originalIndex + 1}`,
      hostsRequested: Number(req.hosts || req.hostsRequested || 0),
      vlanId: req.vlanId || null,
      role: req.role || 'general',
      originalIndex
    }))
    .sort((a, b) => b.hostsRequested - a.hostsRequested);

  let currentPointerInt = rootStartInt;
  let totalRequestedHosts = 0;
  let totalAllocatedIps = 0;
  const allocations = [];

  for (const item of sorted) {
    if (item.hostsRequested <= 0) {
      throw new Error(`Invalid host request for ${item.name}: ${item.hostsRequested}`);
    }

    const prefix = calculateRequiredPrefix(item.hostsRequested);
    const blockSize = Math.pow(2, 32 - prefix);
    
    // Align currentPointerInt to the boundary of blockSize
    // Subnet boundary requirement: currentPointerInt must be a multiple of blockSize
    const remainder = currentPointerInt % blockSize;
    if (remainder !== 0) {
      currentPointerInt = (currentPointerInt + (blockSize - remainder)) >>> 0;
    }

    const subnetEndInt = (currentPointerInt + blockSize - 1) >>> 0;

    // Check for space exhaustion
    if (subnetEndInt > rootEndInt || currentPointerInt > rootEndInt) {
      throw new SubnetExhaustionError(
        `Address space exhaustion: Cannot allocate /${prefix} (${blockSize} IPs) for '${item.name}' (needs ${item.hostsRequested} hosts). Root prefix ${rootCidr} has ${rootTotalIps} total IPs.`,
        {
          rootCidr,
          failedSubnet: item.name,
          hostsRequested: item.hostsRequested,
          requiredPrefix: prefix,
          currentAllocatedIps: totalAllocatedIps,
          rootCapacity: rootTotalIps
        }
      );
    }

    const netAddress = intToIp(currentPointerInt);
    const broadcastAddress = intToIp(subnetEndInt);
    const netmask = cidrToNetmaskStr(prefix);
    const wildcard = cidrToWildcardStr(prefix);

    let firstUsable, lastUsable, usableCount;
    if (prefix === 32) {
      firstUsable = netAddress;
      lastUsable = netAddress;
      usableCount = 1;
    } else if (prefix === 31) {
      firstUsable = netAddress;
      lastUsable = broadcastAddress;
      usableCount = 2;
    } else {
      firstUsable = intToIp((currentPointerInt + 1) >>> 0);
      lastUsable = intToIp((subnetEndInt - 1) >>> 0);
      usableCount = blockSize - 2;
    }

    allocations.push({
      id: item.id,
      name: item.name,
      vlanId: item.vlanId,
      role: item.role,
      hostsRequested: item.hostsRequested,
      prefix,
      cidr: `${netAddress}/${prefix}`,
      networkAddress: netAddress,
      firstUsable,
      lastUsable,
      broadcastAddress,
      defaultGateway: firstUsable, // By standard practice, first usable assigned to SVI/Router Gateway
      netmask,
      wildcardMask: wildcard,
      totalIps: blockSize,
      usableHosts: usableCount,
      hostUtilizationPct: Number(((item.hostsRequested / usableCount) * 100).toFixed(1))
    });

    totalRequestedHosts += item.hostsRequested;
    totalAllocatedIps += blockSize;
    currentPointerInt = (subnetEndInt + 1) >>> 0;
  }

  // Restore sorting or keep descending
  const efficiencyPct = Number(((totalRequestedHosts / totalAllocatedIps) * 100).toFixed(1));
  const rootUtilizationPct = Number(((totalAllocatedIps / rootTotalIps) * 100).toFixed(1));

  const rationale = `Sorted ${requests.length} subnet requests in descending order by required host count. Dynamically allocated ${allocations.length} power-of-two non-overlapping blocks from root ${rootCidr}. Total usable capacity: ${totalAllocatedIps} IPs (${rootUtilizationPct}% of root prefix space). Subnet host packing efficiency is ${efficiencyPct}%, eliminating waste adhering to RFC 1878 / RFC 4632 bitwise subnet boundaries.`;

  return {
    rootCidr,
    rootTotalIps,
    totalRequestedHosts,
    totalAllocatedIps,
    efficiencyPct,
    rootUtilizationPct,
    allocations,
    rationale
  };
}

function cidrToNetmaskInt(prefixLen) {
  if (prefixLen === 0) return 0;
  return (~((1 << (32 - prefixLen)) - 1)) >>> 0;
}

