/**
 * Unit conversion and formatting utilities for network parameters
 */

export function formatDistance(meters) {
  if (meters === undefined || meters === null || isNaN(meters)) return 'N/A';
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(meters % 1000 === 0 ? 0 : 2)} km`;
  }
  return `${meters} m`;
}

export function formatBandwidth(bps) {
  if (bps === undefined || bps === null || isNaN(bps)) return 'N/A';
  if (bps >= 1e12) return `${(bps / 1e12).toFixed(1)} Tbps`;
  if (bps >= 1e9) return `${(bps / 1e9).toFixed(0)} Gbps`;
  if (bps >= 1e6) return `${(bps / 1e6).toFixed(0)} Mbps`;
  if (bps >= 1e3) return `${(bps / 1e3).toFixed(0)} Kbps`;
  return `${bps} bps`;
}

export function parseDistanceMeters(input) {
  if (typeof input === 'number') return input;
  if (!input || typeof input !== 'string') return NaN;
  const clean = input.trim().toLowerCase();
  if (clean.endsWith('km')) {
    return parseFloat(clean.replace('km', '').trim()) * 1000;
  }
  if (clean.endsWith('m')) {
    return parseFloat(clean.replace('m', '').trim());
  }
  return parseFloat(clean);
}

