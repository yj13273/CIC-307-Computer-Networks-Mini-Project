/**
 * Common Network Model definition and normalization builders
 */

export class NetworkModel {
  constructor({
    schemaVersion = '1.0',
    profileId,
    displayName,
    scope = '',
    description = '',
    sites = [],
    devices = [],
    links = [],
    endpointGroups = [],
    addressing = {},
    switching = {},
    routing = {},
    security = {},
    performance = {},
    resiliency = {},
    assumptions = []
  } = {}) {
    this.schemaVersion = schemaVersion;
    this.profileId = profileId;
    this.displayName = displayName;
    this.scope = scope;
    this.description = description;
    this.sites = sites;
    this.devices = devices;
    this.links = links;
    this.endpointGroups = endpointGroups;
    this.addressing = addressing;
    this.switching = switching;
    this.routing = routing;
    this.security = security;
    this.performance = performance;
    this.resiliency = resiliency;
    this.assumptions = assumptions;
  }
}

