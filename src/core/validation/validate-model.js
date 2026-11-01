/**
 * Common Network Model Validation
 * Checks structural, referential, value, and physical constraints.
 */
import { createDiagnostic, PhysicalDistanceViolationError } from './validation-errors.js';
import { isValidIpv4, parseCidr } from '../../utils/ip-address.js';

export function validateNetworkModel(model) {
  const issues = [];

  if (!model || typeof model !== 'object') {
    issues.push(createDiagnostic({
      code: 'INVALID_MODEL',
      severity: 'error',
      description: 'Network model is null or not an object.'
    }));
    return { valid: false, issues, errors: issues, warnings: [] };
  }

  // 1. Structural Checks
  if (!model.profileId) {
    issues.push(createDiagnostic({
      code: 'MISSING_PROFILE_ID',
      severity: 'error',
      description: 'Model missing mandatory profileId.'
    }));
  }

  const sites = Array.isArray(model.sites) ? model.sites : [];
  const devices = Array.isArray(model.devices) ? model.devices : [];
  const links = Array.isArray(model.links) ? model.links : [];

  if (sites.length === 0) {
    issues.push(createDiagnostic({
      code: 'NO_SITES_DEFINED',
      severity: 'error',
      description: 'Network model must define at least one site.'
    }));
  }

  // Check unique IDs for sites
  const siteIdSet = new Set();
  sites.forEach(site => {
    if (!site.id) {
      issues.push(createDiagnostic({
        code: 'SITE_MISSING_ID',
        severity: 'error',
        description: 'Site is missing an id.',
        affectedEntity: site.name || 'unknown'
      }));
    } else if (siteIdSet.has(site.id)) {
      issues.push(createDiagnostic({
        code: 'DUPLICATE_SITE_ID',
        severity: 'error',
        description: `Duplicate site ID detected: ${site.id}`,
        affectedEntity: site.id
      }));
    } else {
      siteIdSet.add(site.id);
    }
  });

  // Check unique IDs for devices and referential siteId
  const deviceIdSet = new Set();
  devices.forEach(dev => {
    if (!dev.id) {
      issues.push(createDiagnostic({
        code: 'DEVICE_MISSING_ID',
        severity: 'error',
        description: 'Device is missing an id.',
        affectedEntity: dev.name || 'unknown'
      }));
    } else if (deviceIdSet.has(dev.id)) {
      issues.push(createDiagnostic({
        code: 'DUPLICATE_DEVICE_ID',
        severity: 'error',
        description: `Duplicate device ID detected: ${dev.id}`,
        affectedEntity: dev.id
      }));
    } else {
      deviceIdSet.add(dev.id);
    }

    if (dev.siteId && !siteIdSet.has(dev.siteId)) {
      issues.push(createDiagnostic({
        code: 'UNKNOWN_SITE_REFERENCE',
        severity: 'error',
        description: `Device '${dev.name || dev.id}' references non-existent site '${dev.siteId}'.`,
        affectedEntity: dev.id,
        expectedConstraint: 'Device siteId must match an existing site in sites collection.',
        actualValue: dev.siteId,
        suggestedResolution: 'Correct device siteId mapping.'
      }));
    }
  });

  // Check links (referential & physical distance rules)
  links.forEach(link => {
    if (!link.id) {
      issues.push(createDiagnostic({
        code: 'LINK_MISSING_ID',
        severity: 'error',
        description: 'Link is missing an id.',
        affectedEntity: link.name || 'unknown'
      }));
    }

    if (link.sourceEndpointId && !deviceIdSet.has(link.sourceEndpointId)) {
      issues.push(createDiagnostic({
        code: 'UNKNOWN_LINK_SOURCE',
        severity: 'error',
        description: `Link '${link.name || link.id}' references unknown source device '${link.sourceEndpointId}'.`,
        affectedEntity: link.id
      }));
    }

    if (link.targetEndpointId && !deviceIdSet.has(link.targetEndpointId)) {
      issues.push(createDiagnostic({
        code: 'UNKNOWN_LINK_TARGET',
        severity: 'error',
        description: `Link '${link.name || link.id}' references unknown target device '${link.targetEndpointId}'.`,
        affectedEntity: link.id
      }));
    }

    // Distance checks
    if (typeof link.distanceM !== 'number' || isNaN(link.distanceM) || link.distanceM < 0) {
      issues.push(createDiagnostic({
        code: 'INVALID_LINK_DISTANCE',
        severity: 'error',
        description: `Link '${link.name || link.id}' has invalid distance: ${link.distanceM}. Distance must be a non-negative finite number.`,
        affectedEntity: link.id,
        expectedConstraint: 'distanceM >= 0',
        actualValue: String(link.distanceM)
      }));
    }

    // Boundary rule from Assignment PDF:
    // "Boundary Error: Copper request > 100m: Raise PhysicalDistanceViolationError with signal attenuation warning."
    const requestedMedium = (link.requestedMedium || link.intentMedium || '').toLowerCase();
    if (requestedMedium === 'copper' && link.distanceM > 100) {
      issues.push(createDiagnostic({
        code: 'PHYSICAL_DISTANCE_VIOLATION',
        severity: 'error',
        description: `Physical distance violation: Link '${link.name || link.id}' requests Copper (Cat6a / 10GBASE-T) over ${link.distanceM}m, which exceeds the strict IEEE 802.3an 100-meter channel limit. Severe high-frequency signal attenuation, inter-symbol interference, and packet loss will occur.`,
        affectedEntity: link.id,
        expectedConstraint: 'Copper distance <= 100m (IEEE 802.3an)',
        actualValue: `${link.distanceM}m`,
        suggestedResolution: 'Upgrade link medium to OM4 Multimode Fiber (for <=400m) or OS2 Single-Mode Fiber (for >400m).',
        relatedEngine: 'physical-media'
      }));
    }
  });

  // Addressing validation
  if (model.addressing) {
    if (model.addressing.rootPrefix) {
      try {
        parseCidr(model.addressing.rootPrefix);
      } catch (err) {
        issues.push(createDiagnostic({
          code: 'INVALID_ROOT_PREFIX',
          severity: 'error',
          description: `Invalid root prefix: ${model.addressing.rootPrefix}. ${err.message}`,
          affectedEntity: 'addressing.rootPrefix',
          suggestedResolution: 'Provide a valid IPv4 CIDR prefix such as 10.10.0.0/16.'
        }));
      }
    }
  }

  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');

  return {
    valid: errors.length === 0,
    issues,
    errors,
    warnings
  };
}

