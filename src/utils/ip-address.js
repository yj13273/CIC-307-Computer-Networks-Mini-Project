/**
 * IPv4 Address and Bitwise Manipulations
 */

export function isValidIpv4(ip) {
  if (typeof ip !== 'string') return false;
  const parts = ip.trim().split('.');
  if (parts.length !== 4) return false;
  return parts.every(part => {
    if (!/^\d+$/.test(part)) return false;
    const num = Number(part);
    return num >= 0 && num <= 255 && (part === '0' || !part.startsWith('0'));
  });
}

export function ipToInt(ip) {
  if (!isValidIpv4(ip)) {
    throw new Error(`Invalid IPv4 address: ${ip}`);
  }
  const octets = ip.split('.').map(Number);
  // Use unsigned 32-bit integer arithmetic:
  return ((octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>> 0;
}

export function intToIp(intVal) {
  const unsigned = intVal >>> 0;
  return [
    (unsigned >>> 24) & 255,
    (unsigned >>> 16) & 255,
    (unsigned >>> 8) & 255,
    unsigned & 255
  ].join('.');
}

export function cidrToNetmaskInt(prefixLen) {
  if (prefixLen < 0 || prefixLen > 32) {
    throw new Error(`Invalid CIDR prefix length: /${prefixLen}`);
  }
  if (prefixLen === 0) return 0;
  return (~((1 << (32 - prefixLen)) - 1)) >>> 0;
}

export function cidrToNetmaskStr(prefixLen) {
  return intToIp(cidrToNetmaskInt(prefixLen));
}

export function cidrToWildcardStr(prefixLen) {
  const maskInt = cidrToNetmaskInt(prefixLen);
  const wildcardInt = (~maskInt) >>> 0;
  return intToIp(wildcardInt);
}

export function parseCidr(cidrStr) {
  if (!cidrStr || typeof cidrStr !== 'string' || !cidrStr.includes('/')) {
    throw new Error(`Invalid CIDR format: ${cidrStr}. Expected format: x.x.x.x/yy`);
  }
  const [ipPart, prefixPart] = cidrStr.trim().split('/');
  const prefix = parseInt(prefixPart, 10);
  if (isNaN(prefix) || prefix < 0 || prefix > 32) {
    throw new Error(`Invalid prefix length in CIDR: /${prefixPart}`);
  }
  if (!isValidIpv4(ipPart)) {
    throw new Error(`Invalid IP in CIDR: ${ipPart}`);
  }
  return {
    ip: ipPart,
    prefix,
    netmask: cidrToNetmaskStr(prefix),
    wildcard: cidrToWildcardStr(prefix)
  };
}

