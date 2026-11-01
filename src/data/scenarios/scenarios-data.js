/**
 * Static scenario objects ensuring 100% compatibility across all browsers and file protocols.
 */

export const CAMPUS_LAN_SCENARIO = {
  "schemaVersion": "1.0",
  "profileId": "campus-lan",
  "displayName": "Profile 1: Campus LAN",
  "scope": "3 Buildings, <400m, 1,600 endpoints, PoE APs",
  "description": "High-density educational enterprise campus network across 3 physical facilities with PoE 802.11ax wireless access points, 802.1Q VLAN segmentation, Rapid Spanning Tree Protocol (RSTP), and Single-Area OSPF core routing.",
  "parameters": {
    "scale": {
      "buildings": 3,
      "maxDistanceM": 350,
      "totalEndpoints": 1600
    },
    "sites": [
      {
        "id": "site-eng",
        "name": "Building 1 — Engineering Complex",
        "role": "core-distribution",
        "floors": 4,
        "wiringClosets": 4
      },
      {
        "id": "site-sci",
        "name": "Building 2 — Science & Research Hall",
        "role": "access-distribution",
        "floors": 3,
        "wiringClosets": 3
      },
      {
        "id": "site-adm",
        "name": "Building 3 — Administration & Student Center",
        "role": "access-distribution",
        "floors": 2,
        "wiringClosets": 2
      }
    ],
    "devices": [
      {
        "id": "core-sw-01",
        "siteId": "site-eng",
        "name": "CORE-SW-01",
        "role": "core-switch",
        "platform": "Cisco Catalyst 9500-24Y4C",
        "layer": 3
      },
      {
        "id": "dist-sw-eng",
        "siteId": "site-eng",
        "name": "DIST-SW-ENG",
        "role": "distribution-switch",
        "platform": "Cisco Catalyst 9300-48P",
        "layer": 3
      },
      {
        "id": "dist-sw-sci",
        "siteId": "site-sci",
        "name": "DIST-SW-SCI",
        "role": "distribution-switch",
        "platform": "Cisco Catalyst 9300-48P",
        "layer": 3
      },
      {
        "id": "dist-sw-adm",
        "siteId": "site-adm",
        "name": "DIST-SW-ADM",
        "role": "distribution-switch",
        "platform": "Cisco Catalyst 9300-48P",
        "layer": 3
      },
      {
        "id": "edge-rtr-01",
        "siteId": "site-eng",
        "name": "EDGE-RTR-01",
        "role": "perimeter-router",
        "platform": "Cisco ISR 4451-X",
        "layer": 3
      }
    ],
    "links": [
      {
        "id": "link-eng-sci",
        "name": "Building 1 to Building 2 Backbone",
        "sourceEndpointId": "core-sw-01",
        "targetEndpointId": "dist-sw-sci",
        "distanceM": 240,
        "bandwidthRequirementBps": 10000000000,
        "intentMedium": "fiber",
        "redundant": true
      },
      {
        "id": "link-eng-adm",
        "name": "Building 1 to Building 3 Backbone",
        "sourceEndpointId": "core-sw-01",
        "targetEndpointId": "dist-sw-adm",
        "distanceM": 320,
        "bandwidthRequirementBps": 10000000000,
        "intentMedium": "fiber",
        "redundant": true
      },
      {
        "id": "link-eng-local",
        "name": "Building 1 Core-to-Distribution Interconnect",
        "sourceEndpointId": "core-sw-01",
        "targetEndpointId": "dist-sw-eng",
        "distanceM": 45,
        "bandwidthRequirementBps": 10000000000,
        "intentMedium": "copper",
        "redundant": true
      },
      {
        "id": "link-sci-adm-cross",
        "name": "Building 2 to Building 3 Cross-Link",
        "sourceEndpointId": "dist-sw-sci",
        "targetEndpointId": "dist-sw-adm",
        "distanceM": 180,
        "bandwidthRequirementBps": 10000000000,
        "intentMedium": "fiber",
        "redundant": false
      },
      {
        "id": "link-core-edge",
        "name": "Core to Edge Gateway Uplink",
        "sourceEndpointId": "core-sw-01",
        "targetEndpointId": "edge-rtr-01",
        "distanceM": 15,
        "bandwidthRequirementBps": 10000000000,
        "intentMedium": "copper",
        "redundant": true
      }
    ],
    "addressing": {
      "rootPrefix": "10.10.0.0/16",
      "strategy": "VLSM",
      "subnetRequests": [
        {
          "id": "sub-students",
          "name": "Student BYOD Wireless",
          "hosts": 850,
          "vlanId": 10,
          "role": "wireless-access"
        },
        {
          "id": "sub-faculty",
          "name": "Faculty & Staff Workstations",
          "hosts": 350,
          "vlanId": 20,
          "role": "wired-access"
        },
        {
          "id": "sub-labs",
          "name": "Computer Science & Engineering Labs",
          "hosts": 220,
          "vlanId": 30,
          "role": "wired-lab"
        },
        {
          "id": "sub-voip",
          "name": "Campus VoIP Telephony",
          "hosts": 120,
          "vlanId": 40,
          "role": "voice-qos"
        },
        {
          "id": "sub-infra",
          "name": "Network Management & AP Loopbacks",
          "hosts": 60,
          "vlanId": 99,
          "role": "management"
        }
      ]
    },
    "switching": {
      "vlanTagging": "802.1Q",
      "spanningTree": "RSTP (IEEE 802.1w Rapid-PVST+)",
      "trunkEncap": "dot1q",
      "poeStandard": "802.3bt Type 4 (90W) PoE++ for Wi-Fi 6 APs"
    },
    "routing": {
      "protocol": "OSPF",
      "area": "0",
      "metric": "cost-bandwidth-reference 100000",
      "convergenceTarget": "sub-second"
    },
    "security": {
      "aclStrategy": "Role-based Layer 3 SVI ACLs",
      "guestIsolation": true,
      "managementProtected": true
    },
    "resiliency": {
      "topology": "Partial Mesh Backbone with First-Hop Redundancy (HSRP/VRRP)",
      "linkAggregation": "802.3ad LACP (2x10Gbps trunks)"
    }
  }
};

export const METRO_MAN_SCENARIO = {
  "schemaVersion": "1.0",
  "profileId": "metro-man",
  "displayName": "Profile 2: Metro MAN",
  "scope": "HQ + 2 Remote (15–35km), 450 users, FinTech Colo",
  "description": "Ultra-reliable financial services Metropolitan Area Network linking corporate headquarters with a low-latency carrier colocation exchange and disaster recovery disaster center across metropolitan distances with EVPL and sub-5ms latency SLAs.",
  "parameters": {
    "scale": {
      "sites": 3,
      "maxDistanceKm": 35,
      "totalEndpoints": 450
    },
    "sites": [
      {
        "id": "site-hq",
        "name": "Financial HQ — Downtown Tower",
        "role": "headquarters",
        "latencyTargetMs": 1.5
      },
      {
        "id": "site-colo",
        "name": "FinTech Exchange Colocation (Equinix NY4)",
        "role": "colocation-trading",
        "latencyTargetMs": 0.8
      },
      {
        "id": "site-dr",
        "name": "Disaster Recovery Facility — Metro West",
        "role": "disaster-recovery",
        "latencyTargetMs": 4.5
      }
    ],
    "devices": [
      {
        "id": "man-rtr-hq-1",
        "siteId": "site-hq",
        "name": "HQ-WAN-RTR-01",
        "role": "metro-pe-router",
        "platform": "Cisco ASR 1001-X",
        "layer": 3
      },
      {
        "id": "man-rtr-hq-2",
        "siteId": "site-hq",
        "name": "HQ-WAN-RTR-02",
        "role": "metro-pe-router-secondary",
        "platform": "Cisco ASR 1001-X",
        "layer": 3
      },
      {
        "id": "man-rtr-colo",
        "siteId": "site-colo",
        "name": "COLO-TRADING-RTR-01",
        "role": "fintech-gateway",
        "platform": "Cisco Nexus 93180YC-FX",
        "layer": 3
      },
      {
        "id": "man-rtr-dr",
        "siteId": "site-dr",
        "name": "DR-FACILITY-RTR-01",
        "role": "dr-gateway",
        "platform": "Cisco ASR 1001-X",
        "layer": 3
      }
    ],
    "links": [
      {
        "id": "link-hq-colo-primary",
        "name": "HQ to FinTech Colo Primary Carrier Link",
        "sourceEndpointId": "man-rtr-hq-1",
        "targetEndpointId": "man-rtr-colo",
        "distanceM": 18200,
        "bandwidthRequirementBps": 10000000000,
        "serviceType": "EVPL (Carrier Ethernet E-Line)",
        "intentMedium": "fiber",
        "targetLatencyMs": 1.2
      },
      {
        "id": "link-hq-colo-secondary",
        "name": "HQ to FinTech Colo Redundant Carrier Path",
        "sourceEndpointId": "man-rtr-hq-2",
        "targetEndpointId": "man-rtr-colo",
        "distanceM": 21500,
        "bandwidthRequirementBps": 10000000000,
        "serviceType": "EVPL (Carrier Ethernet E-Line)",
        "intentMedium": "fiber",
        "targetLatencyMs": 1.4
      },
      {
        "id": "link-hq-dr",
        "name": "HQ to Disaster Recovery Facility Interconnect",
        "sourceEndpointId": "man-rtr-hq-1",
        "targetEndpointId": "man-rtr-dr",
        "distanceM": 32400,
        "bandwidthRequirementBps": 10000000000,
        "serviceType": "Dark Fiber / EVPL",
        "intentMedium": "fiber",
        "targetLatencyMs": 3.8
      },
      {
        "id": "link-colo-dr",
        "name": "Colo to DR Direct Replication Bypass",
        "sourceEndpointId": "man-rtr-colo",
        "targetEndpointId": "man-rtr-dr",
        "distanceM": 28600,
        "bandwidthRequirementBps": 10000000000,
        "serviceType": "EVPL",
        "intentMedium": "fiber",
        "targetLatencyMs": 3.2
      }
    ],
    "addressing": {
      "rootPrefix": "172.16.0.0/16",
      "strategy": "VLSM",
      "subnetRequests": [
        {
          "id": "sub-trading",
          "name": "Algorithmic Trading & Analytics Subnet",
          "hosts": 180,
          "vlanId": 110,
          "role": "fintech-hft"
        },
        {
          "id": "sub-banking",
          "name": "Banking Operations & Settlement Tier",
          "hosts": 120,
          "vlanId": 120,
          "role": "transactional"
        },
        {
          "id": "sub-dr-repl",
          "name": "Disaster Recovery Database Mirroring",
          "hosts": 90,
          "vlanId": 130,
          "role": "database-replication"
        },
        {
          "id": "sub-man-mgmt",
          "name": "Out-of-Band Colo Management & Monitoring",
          "hosts": 60,
          "vlanId": 199,
          "role": "management-oob"
        }
      ]
    },
    "switching": {
      "vlanTagging": "802.1Q EVPL QinQ / 802.1ad Service Provider Tagging",
      "spanningTree": "MSTP / Rapid-PVST+ across local access",
      "qosPolicy": "Strict Priority Queuing for Low-Latency Execution"
    },
    "routing": {
      "protocol": "OSPF + BFD",
      "area": "0",
      "sub5msQoS": true,
      "bfdFastFailover": true,
      "helloIntervalSec": 1,
      "deadIntervalSec": 3
    },
    "security": {
      "macsec": "802.1AE Layer 2 wire-speed line encryption",
      "auditLogging": "Strict FINRA / SEC Rule 17a-4 compliant logging"
    },
    "resiliency": {
      "dualHomed": true,
      "slaTarget": "99.999% availability, sub-5ms one-way delay"
    }
  }
};

export const GLOBAL_WAN_SCENARIO = {
  "schemaVersion": "1.0",
  "profileId": "global-wan",
  "displayName": "Profile 3: Global WAN",
  "scope": "4 Cities + Cloud VPC, 2,000 IoT / scanners",
  "description": "Multi-region worldwide enterprise and logistics network spanning New York, London, Tokyo, Singapore, and AWS Cloud VPC. Features route summarization, multi-area OSPF backbone, exterior BGP peering, and IPsec tunnel overlays for secure edge scanner aggregation.",
  "parameters": {
    "scale": {
      "cities": 4,
      "cloudVpcs": 1,
      "totalEndpoints": 2000
    },
    "sites": [
      {
        "id": "site-nyc",
        "name": "New York Regional Hub (Americas HQ)",
        "role": "core-hub",
        "region": "Americas",
        "asn": 65000
      },
      {
        "id": "site-lon",
        "name": "London Logistics Center (EMEA Hub)",
        "role": "regional-branch",
        "region": "EMEA",
        "asn": 65001
      },
      {
        "id": "site-tyo",
        "name": "Tokyo Distribution Center (APAC Hub)",
        "role": "regional-branch",
        "region": "APAC",
        "asn": 65002
      },
      {
        "id": "site-sin",
        "name": "Singapore Automation Hub (Southeast Asia)",
        "role": "regional-branch",
        "region": "APAC",
        "asn": 65003
      },
      {
        "id": "site-aws",
        "name": "AWS Cloud VPC (us-east-1 Transit Gateway)",
        "role": "cloud-vpc",
        "region": "Global Cloud",
        "asn": 64512
      }
    ],
    "devices": [
      {
        "id": "wan-rtr-nyc",
        "siteId": "site-nyc",
        "name": "NYC-WAN-EDGE-01",
        "role": "core-abr-router",
        "platform": "Cisco ASR 1002-HX",
        "layer": 3
      },
      {
        "id": "wan-rtr-lon",
        "siteId": "site-lon",
        "name": "LON-WAN-EDGE-01",
        "role": "branch-router",
        "platform": "Cisco ISR 4331",
        "layer": 3
      },
      {
        "id": "wan-rtr-tyo",
        "siteId": "site-tyo",
        "name": "TYO-WAN-EDGE-01",
        "role": "branch-router",
        "platform": "Cisco ISR 4331",
        "layer": 3
      },
      {
        "id": "wan-rtr-sin",
        "siteId": "site-sin",
        "name": "SIN-WAN-EDGE-01",
        "role": "branch-router",
        "platform": "Cisco ISR 4331",
        "layer": 3
      },
      {
        "id": "cloud-tgw-aws",
        "siteId": "site-aws",
        "name": "AWS-TGW-EDGE-01",
        "role": "cloud-transit-gateway",
        "platform": "AWS Transit Gateway Appliance",
        "layer": 3
      }
    ],
    "links": [
      {
        "id": "link-nyc-aws",
        "name": "New York HQ to AWS Cloud Direct Connect / IPsec",
        "sourceEndpointId": "wan-rtr-nyc",
        "targetEndpointId": "cloud-tgw-aws",
        "distanceM": 450000,
        "bandwidthRequirementBps": 10000000000,
        "technology": "AWS Direct Connect 10G with IPsec Failover",
        "intentMedium": "fiber",
        "overlay": "IPsec / eBGP"
      },
      {
        "id": "link-nyc-lon",
        "name": "Transatlantic Subsea Cable NYC-LON",
        "sourceEndpointId": "wan-rtr-nyc",
        "targetEndpointId": "wan-rtr-lon",
        "distanceM": 5585000,
        "bandwidthRequirementBps": 10000000000,
        "technology": "Submarine OS2 Single-Mode Coherent Optical",
        "intentMedium": "fiber",
        "overlay": "IPsec VPN"
      },
      {
        "id": "link-nyc-tyo",
        "name": "Transpacific Cable NYC-TYO via West Coast",
        "sourceEndpointId": "wan-rtr-nyc",
        "targetEndpointId": "wan-rtr-tyo",
        "distanceM": 10850000,
        "bandwidthRequirementBps": 10000000000,
        "technology": "Submarine OS2 Single-Mode Optical Carrier",
        "intentMedium": "fiber",
        "overlay": "IPsec VPN"
      },
      {
        "id": "link-tyo-sin",
        "name": "Intra-Asia Backbone TYO-SIN",
        "sourceEndpointId": "wan-rtr-tyo",
        "targetEndpointId": "wan-rtr-sin",
        "distanceM": 5300000,
        "bandwidthRequirementBps": 5000000000,
        "technology": "Submarine OS2 Optical",
        "intentMedium": "fiber",
        "overlay": "IPsec VPN"
      }
    ],
    "addressing": {
      "rootPrefix": "10.0.0.0/14",
      "strategy": "Hierarchical VLSM with Route Summarization",
      "subnetRequests": [
        {
          "id": "sub-iot-fleet",
          "name": "Global Logistics Scanners & IoT Sensors Fleet",
          "hosts": 1100,
          "vlanId": 500,
          "role": "iot-fleet"
        },
        {
          "id": "sub-corp-workstations",
          "name": "Multi-Region Corporate Workstations",
          "hosts": 550,
          "vlanId": 200,
          "role": "corporate"
        },
        {
          "id": "sub-cloud-microservices",
          "name": "AWS Cloud Container & Microservices Subnet",
          "hosts": 250,
          "vlanId": 300,
          "role": "cloud-workloads"
        },
        {
          "id": "sub-hub-wan-p2p",
          "name": "Inter-Site Point-to-Point WAN Links",
          "hosts": 64,
          "vlanId": 400,
          "role": "wan-interconnect"
        }
      ]
    },
    "switching": {
      "vlanTagging": "802.1Q Branch Segmentation",
      "segmentation": "IoT isolated on dedicated VRF / VLAN"
    },
    "routing": {
      "protocol": "Multi-Area OSPF + eBGP",
      "backboneArea": "0 (Americas Hub & Core Transit)",
      "regionalAreas": [
        { "area": "1", "name": "EMEA (London)", "summary": "10.1.0.0/16" },
        { "area": "2", "name": "APAC (Tokyo & Singapore)", "summary": "10.2.0.0/16" }
      ],
      "bgpPeering": {
        "enterpriseAsn": 65000,
        "cloudAsn": 64512,
        "summarizedRouteAdvertised": "10.0.0.0/14"
      },
      "summarization": "RFC 4632 Supernetting to boundary peers"
    },
    "security": {
      "vpn": "IPsec IKEv2 with AES-256-GCM and SHA-384 integrity",
      "iotIsolationAcl": "Strict zero-trust ACL preventing IoT from accessing Corporate and Cloud DB"
    },
    "resiliency": {
      "topology": "Partial Mesh Global Star-Ring Hybrid",
      "bgpMultiHoming": true
    }
  }
};

export const PRESET_SCENARIOS = {
  'campus-lan': CAMPUS_LAN_SCENARIO,
  'metro-man': METRO_MAN_SCENARIO,
  'global-wan': GLOBAL_WAN_SCENARIO
};

export function getScenarioById(profileId) {
  const scenario = PRESET_SCENARIOS[profileId];
  if (!scenario) {
    throw new Error(`Unknown profile ID: ${profileId}. Supported: campus-lan, metro-man, global-wan.`);
  }
  return JSON.parse(JSON.stringify(scenario));
}
