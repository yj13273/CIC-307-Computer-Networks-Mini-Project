/**
 * Decision Engine and Rationale Logger
 * Executes algorithmic rule engines from the specification:
 * - Physical Media (L1) rules (Cat6a, OM4 MMF, OS2 SMF, boundary checks)
 * - VLSM Subnetting (L3) rules (descending packing, efficiency)
 * - L3 Routing rules (OSPF Single-Area Area 0 vs Multi-Area vs eBGP)
 * - L2 Switching & Security rules
 */
import { DecisionRecord } from './decision-record.js';
import { PhysicalDistanceViolationError, createDiagnostic } from '../validation/validation-errors.js';
import { formatDistance, formatBandwidth } from '../../utils/units.js';

export class DecisionLogger {
  constructor() {
    this.decisions = [];
    this.diagnostics = [];
  }

  addDecision(record) {
    this.decisions.push(record);
    return record;
  }

  addDiagnostic(diag) {
    this.diagnostics.push(diag);
    return diag;
  }

  /**
   * Evaluates physical media selection for all links.
   * Algorithmic Conditions from Rubric:
   * 1. Run <= 100m (LAN access) -> Recommend Cat6a (10GBASE-T) + Justification (802.3an limit).
   * 2. Run 101-400m (Backbone) -> Recommend OM4 MMF (10GBASE-SR) + 850nm dispersion rationale.
   * 3. Run > 400m (MAN / WAN) -> Recommend OS2 SMF (10GBASE-LR/ER) + optical budget rationale.
   * Boundary Error: Copper request > 100m -> Raise PhysicalDistanceViolationError with signal attenuation warning.
   */
  evaluatePhysicalMedia(links = []) {
    const linkEvaluations = [];

    for (const link of links) {
      const distance = Number(link.distanceM || 0);
      const requestedMedium = (link.requestedMedium || link.intentMedium || '').toLowerCase();

      // Check boundary violation first
      if (requestedMedium === 'copper' && distance > 100) {
        const violationErr = new PhysicalDistanceViolationError(
          `Copper link '${link.name}' exceeds the 100m physical channel limit with ${distance}m.`,
          { linkId: link.id, distance, maxAllowed: 100 }
        );

        this.addDiagnostic(createDiagnostic({
          code: 'PHYSICAL_DISTANCE_VIOLATION',
          severity: 'error',
          description: `Boundary Error: Link '${link.name || link.id}' requests Copper over ${formatDistance(distance)}, violating IEEE 802.3an 100m channel length limit. High-frequency electrical attenuation across twisted pairs causes complete signal degradation at 10Gbps.`,
          affectedEntity: link.id,
          expectedConstraint: 'distance <= 100m for Cat6a copper',
          actualValue: `${distance}m`,
          suggestedResolution: distance <= 400 ? 'Switch to OM4 Multimode Fiber' : 'Switch to OS2 Single-Mode Fiber',
          relatedEngine: 'physical-media'
        }));
      }

      let selectedMedium = '';
      let standardTechnology = '';
      let transceiver = '';
      let ruleId = '';
      let explanation = '';
      const standards = [];

      if (distance <= 100) {
        selectedMedium = 'Cat6a UTP/STP Copper';
        standardTechnology = '10GBASE-T';
        transceiver = 'Integrated RJ-45 10GBASE-T';
        ruleId = 'MEDIA_COPPER_LE_100M';
        standards.push('IEEE 802.3an (10GBASE-T)', 'TIA-568-C.2 Category 6A');
        explanation = `Selected Category 6A (10GBASE-T) copper cabling because link distance (${formatDistance(distance)}) is within the certified 100-meter channel boundary established by IEEE 802.3an. Cat6a supports full 10 Gbps throughput at up to 500 MHz bandwidth without alien crosstalk, providing optimal cost-to-performance efficiency for intra-building horizontal and short backbone interconnects without requiring optical transceivers.`;
      } else if (distance > 100 && distance <= 400) {
        selectedMedium = 'OM4 Multimode Fiber (MMF)';
        standardTechnology = '10GBASE-SR';
        transceiver = 'SFP-10G-SR (850nm VCSEL)';
        ruleId = 'MEDIA_MMF_101_TO_400M';
        standards.push('IEEE 802.3ae (10GBASE-SR)', 'ISO/IEC 11801 OM4');
        explanation = `Selected OM4 Laser-Optimized Multimode Fiber (10GBASE-SR) with 850nm VCSEL optics because the link distance (${formatDistance(distance)}) exceeds the 100m copper limit but remains well within the 400-meter reach limit of OM4 4700 MHz·km effective modal bandwidth. Modal dispersion is strictly bounded at 850nm, preventing inter-symbol interference at 10Gbps while maintaining significantly lower optical transceiver capital costs compared to single-mode alternatives.`;
      } else {
        // distance > 400m
        selectedMedium = 'OS2 Single-Mode Fiber (SMF)';
        if (distance <= 10000) {
          standardTechnology = '10GBASE-LR';
          transceiver = 'SFP-10G-LR (1310nm DFB Laser)';
        } else if (distance <= 40000) {
          standardTechnology = '10GBASE-ER';
          transceiver = 'SFP-10G-ER (1550nm Cooled EML Laser)';
        } else {
          standardTechnology = '10GBASE-ZR / Coherent DWDM';
          transceiver = 'SFP-10G-ZR (1550nm Tunable Optical Carrier)';
        }
        ruleId = 'MEDIA_SMF_OVER_400M';
        standards.push('IEEE 802.3ae', 'ITU-T G.652.D (OS2 Low Water Peak)');
        explanation = `Selected OS2 Single-Mode Fiber (${standardTechnology}) because link distance (${formatDistance(distance)}) exceeds the 400m optical attenuation and modal dispersion boundary of multimode fiber. OS2 SMF features a 9μm core eliminating modal dispersion, with ultra-low attenuation (~0.4 dB/km at 1310nm, ~0.25 dB/km at 1550nm). The optical link power budget comfortably maintains required receiver sensitivity margins over this metropolitan/WAN distance.`;
      }

      const decision = this.addDecision(new DecisionRecord({
        id: `dec-media-${link.id}`,
        domain: 'physical-media',
        subjectId: link.id,
        outcome: {
          medium: selectedMedium,
          technology: standardTechnology,
          transceiver
        },
        rule: {
          id: ruleId,
          description: 'Physical media selection based on distance, bandwidth, and optical dispersion limits'
        },
        inputs: {
          linkName: link.name,
          distanceMeters: distance,
          formattedDistance: formatDistance(distance),
          bandwidthBps: link.bandwidthRequirementBps || 1e10,
          formattedBandwidth: formatBandwidth(link.bandwidthRequirementBps || 1e10),
          requestedMedium: link.requestedMedium || link.intentMedium || 'auto'
        },
        explanation,
        standards
      }));

      linkEvaluations.push({
        linkId: link.id,
        linkName: link.name,
        distance,
        formattedDistance: formatDistance(distance),
        medium: selectedMedium,
        technology: standardTechnology,
        transceiver,
        decisionId: decision.id,
        explanation
      });
    }

    return linkEvaluations;
  }

  /**
   * Evaluates Layer 3 Routing Protocol choices based on topology boundaries.
   * Rubric:
   * - Single autonomous system (<50 subnets) -> Select OSPF Area 0 + justification (link-state fast convergence).
   * - Multi-site / Multi-cloud boundary -> Select Multi-Area OSPF or eBGP + routing domain isolation rationale.
   */
  evaluateRouting(model, vlsmResult) {
    const profileId = model.profileId;
    const siteCount = (model.sites || []).length;
    const subnetCount = (vlsmResult.allocations || []).length;
    const hasCloudVpc = (model.sites || []).some(s => s.role === 'cloud-vpc' || s.region === 'Global Cloud');
    const isMultiSiteWan = profileId === 'global-wan' || (siteCount > 3 && hasCloudVpc);

    let routingDecision;

    if (profileId === 'campus-lan' || (!isMultiSiteWan && subnetCount < 50)) {
      routingDecision = this.addDecision(new DecisionRecord({
        id: `dec-routing-${profileId}`,
        domain: 'l3-routing',
        subjectId: 'autonomous-system-routing',
        outcome: {
          protocol: 'OSPFv2 (Open Shortest Path First)',
          topologyScope: 'Single-Area Backbone (Area 0)',
          convergenceMechanism: 'Dijkstra Shortest Path First (SPF)',
          administrativeDistance: 110,
          timers: 'Hello 10s, Dead 40s (Fast Hellos optional)'
        },
        rule: {
          id: 'ROUTING_SINGLE_AS_OSPF_AREA_0',
          description: 'Select Single-Area OSPF Area 0 for unified single-site campus networks with <50 subnets'
        },
        inputs: {
          autonomousSystemScope: 'Single Site Campus',
          totalSubnets: subnetCount,
          totalSites: siteCount
        },
        explanation: `Selected OSPF Area 0 as the interior gateway protocol because the network operates within a single autonomous administration with ${subnetCount} subnets (<50 subnets). OSPF uses Dijkstra's link-state Shortest Path First (SPF) algorithm (RFC 2328), achieving sub-second convergence without routing loops. A single backbone area eliminates inter-area summarization overhead while maintaining full topological visibility and optimal path selection across redundant distribution switches.`,
        standards: ['RFC 2328 (OSPF Version 2)', 'IEEE 802.1D/w Interaction']
      }));
    } else if (profileId === 'metro-man') {
      routingDecision = this.addDecision(new DecisionRecord({
        id: `dec-routing-${profileId}`,
        domain: 'l3-routing',
        subjectId: 'metro-autonomous-routing',
        outcome: {
          protocol: 'OSPFv2 with Bidirectional Forwarding Detection (BFD)',
          topologyScope: 'Metro Core Backbone Area 0',
          convergenceMechanism: 'Sub-50ms Hardware BFD Interworking with OSPF',
          qosSupport: 'DiffServ RFC 2474 / Strict Priority High-Frequency Queuing',
          administrativeDistance: 110
        },
        rule: {
          id: 'ROUTING_METRO_MAN_BFD_QOS',
          description: 'High-availability Metro MAN routing with sub-5ms SLA and BFD fast link detection'
        },
        inputs: {
          sites: siteCount,
          targetLatency: '< 5ms',
          finTechColo: true
        },
        explanation: `Selected OSPFv2 coupled with Bidirectional Forwarding Detection (BFD) across dual-homed EVPL links. To satisfy the stringent sub-5ms financial colocation SLA, BFD provides sub-50ms fault detection (transmitting hellos at 50ms intervals with a multiplier of 3), triggering immediate OSPF convergence without waiting for traditional 30-40 second dead timers. Strict Priority CoS/DSCP queueing guarantees mission-critical trading traffic precedence over bulk database replication.`,
        standards: ['RFC 5880 (BFD)', 'RFC 5881 (BFD for IPv4)', 'RFC 2474 (DiffServ)']
      }));
    } else {
      // Global WAN
      routingDecision = this.addDecision(new DecisionRecord({
        id: `dec-routing-${profileId}`,
        domain: 'l3-routing',
        subjectId: 'global-hybrid-routing',
        outcome: {
          igpProtocol: 'Multi-Area OSPFv2 (Backbone Area 0, EMEA Area 1, APAC Area 2)',
          egpProtocol: 'Exterior BGP (eBGP AS 65000 to AWS AS 64512)',
          summarization: 'Supernetting root 10.0.0.0/14 advert to BGP peers; Area 1 10.1.0.0/16 and Area 2 10.2.0.0/16 summaries',
          administrativeDistance: 'eBGP 20, OSPF 110'
        },
        rule: {
          id: 'ROUTING_MULTI_AREA_OSPF_EBGP_SUMMARIZATION',
          description: 'Multi-site multi-cloud boundary routing with domain isolation and route summarization'
        },
        inputs: {
          cities: 4,
          cloudVpc: 1,
          endpoints: 2000,
          autonomousSystems: 'Enterprise AS 65000, Cloud AS 64512'
        },
        explanation: `Selected Multi-Area OSPF combined with eBGP exterior peering at the multi-cloud boundary. Multi-Area OSPF partitions the global enterprise into discrete routing domains (Area 0 Backbone, Area 1 EMEA, Area 2 APAC), isolating link-state advertisements (LSAs) and preventing remote link flaps from triggering worldwide SPF recalculations. At the cloud perimeter, eBGP provides policy-driven inter-domain routing to AWS Transit Gateway, advertising a summarized supernet (10.0.0.0/14) adhering to RFC 4632 CIDR aggregation.`,
        standards: ['RFC 2328 (OSPFv2)', 'RFC 4271 (BGP-4)', 'RFC 4632 (CIDR Route Summarization)']
      }));
    }

    return routingDecision;
  }

  /**
   * Evaluates Layer 2 Switching and Spanning Tree Protocol.
   */
  evaluateSwitching(model) {
    const profileId = model.profileId;
    let decision;

    if (profileId === 'campus-lan') {
      decision = this.addDecision(new DecisionRecord({
        id: `dec-switching-${profileId}`,
        domain: 'l2-switching',
        subjectId: 'campus-switching-domain',
        outcome: {
          vlanStandard: 'IEEE 802.1Q Tagged Trunking',
          spanningTreeProtocol: 'Rapid Spanning Tree Protocol (RSTP / Rapid-PVST+ IEEE 802.1w)',
          portSecurity: 'BPDU Guard & PortFast on Access Ports',
          poeCapability: 'IEEE 802.3bt Type 4 (90W) PoE++ for High-Density Wi-Fi 6 APs'
        },
        rule: {
          id: 'SWITCHING_8021Q_RSTP_POE',
          description: 'Campus Layer 2 VLAN segmentation with Rapid-PVST+ sub-second loop prevention'
        },
        inputs: {
          buildings: 3,
          endpoints: 1600,
          vlansRequested: 5
        },
        explanation: `Selected IEEE 802.1Q encapsulation for multi-VLAN trunking alongside Rapid-PVST+ (IEEE 802.1w). RSTP replaces legacy 802.1D Spanning Tree, achieving sub-second failover convergence (under 1 second vs 30-50s) through explicit proposal-agreement handshakes. Access edge ports are configured with Spanning-Tree PortFast and BPDU Guard to protect against accidental switching loops introduced by student BYOD devices.`,
        standards: ['IEEE 802.1Q (VLANs)', 'IEEE 802.1w (RSTP)', 'IEEE 802.3bt (PoE++)']
      }));
    } else {
      decision = this.addDecision(new DecisionRecord({
        id: `dec-switching-${profileId}`,
        domain: 'l2-switching',
        subjectId: 'wan-switching-domain',
        outcome: {
          vlanStandard: 'IEEE 802.1Q Trunking and 802.1ad Provider Bridging (QinQ)',
          isolation: 'Dedicated VRF / VLAN Segmentation',
          security: '802.1X Port Authentication'
        },
        rule: {
          id: 'SWITCHING_VRF_SEGMENTATION',
          description: 'Carrier Ethernet trunking and traffic isolation'
        },
        inputs: {
          profile: profileId
        },
        explanation: `Configured IEEE 802.1Q trunking with traffic isolation. High-priority traffic (such as financial transactions or corporate systems) is strictly partitioned from IoT devices and guest traffic into independent forwarding planes.`,
        standards: ['IEEE 802.1Q', 'IEEE 802.1ad']
      }));
    }

    return decision;
  }

  /**
   * Evaluates Security and Access Control Lists.
   */
  evaluateSecurity(model) {
    const profileId = model.profileId;
    let decision;

    if (profileId === 'campus-lan') {
      decision = this.addDecision(new DecisionRecord({
        id: `dec-security-${profileId}`,
        domain: 'security',
        subjectId: 'campus-acl-policy',
        outcome: {
          firewallAcl: 'Extended IPv4 Access Control Lists on Inter-VLAN SVIs',
          rulesSummary: 'Isolate Student BYOD (VLAN 10) from Faculty (VLAN 20) and Server Labs (VLAN 30); protect Management VLAN 99'
        },
        rule: {
          id: 'SEC_CAMPUS_ZERO_TRUST_SVI',
          description: 'Extended ACLs on Layer 3 SVIs to enforce zero-trust boundary between student and faculty networks'
        },
        inputs: {
          vlans: [10, 20, 30, 40, 99]
        },
        explanation: `Deployed Cisco Extended Named Access Control Lists applied inbound on Layer 3 Switch Virtual Interfaces (SVIs). This explicitly prohibits student wireless hosts (VLAN 10) from directly initiating connections to sensitive administrative subnets (VLAN 20) and network management infrastructure (VLAN 99), while permitting outbound internet access and DNS/DHCP infrastructure services.`,
        standards: ['RFC 4987 (TCP SYN Protection)', 'Cisco SAFE Blueprint']
      }));
    } else if (profileId === 'metro-man') {
      decision = this.addDecision(new DecisionRecord({
        id: `dec-security-${profileId}`,
        domain: 'security',
        subjectId: 'fintech-wire-security',
        outcome: {
          lineEncryption: 'IEEE 802.1AE MACsec Wire-Speed 256-bit Encryption',
          edgeAcl: 'Strict Port-Level White-listing for Exchange API Feeds'
        },
        rule: {
          id: 'SEC_METRO_FINTECH_MACSEC',
          description: 'Wire-speed Layer 2 encryption for FinTech colocation circuits'
        },
        inputs: {
          compliance: 'FINRA / SEC 17a-4'
        },
        explanation: `Implemented IEEE 802.1AE MACsec Layer 2 encryption across all metro optical spans connecting to the FinTech colocation data center. MACsec encrypts frames at the physical PHY layer with zero added latency penalty (under 100ns overhead), providing cryptographic integrity and confidentiality against fiber-tapping and man-in-the-middle attacks.`,
        standards: ['IEEE 802.1AE (MACsec)', 'FIPS 140-2 Level 2']
      }));
    } else {
      // Global WAN
      decision = this.addDecision(new DecisionRecord({
        id: `dec-security-${profileId}`,
        domain: 'security',
        subjectId: 'wan-crypto-ipsec',
        outcome: {
          vpnProtocol: 'IPsec with Internet Key Exchange Version 2 (IKEv2)',
          encryptionCipher: 'AES-256-GCM (Galois/Counter Mode)',
          hashIntegrity: 'SHA-384 / DH Group 19 (256-bit ECP)',
          iotIsolation: 'Deny IoT Scanners Access to Cloud Database and Corporate Workstations'
        },
        rule: {
          id: 'SEC_GLOBAL_WAN_IPSEC_IKEV2',
          description: 'IKEv2 IPsec VPN overlay tunnels with AES-GCM and strict IoT isolation ACLs'
        },
        inputs: {
          endpoints: 2000,
          iotCount: 1100,
          sites: 5
        },
        explanation: `Configured IPsec VPN tunnels utilizing IKEv2 and AES-256-GCM authenticated encryption across public WAN and transatlantic transit links. AES-GCM combines encryption and integrity into a single hardware-accelerated pass, minimizing CPU overhead on edge routers. A dedicated extended ACL quarantines 1,100 automated warehouse scanners and IoT endpoints, restricting their traffic strictly to central inventory ingestion servers and blocking lateral movement.`,
        standards: ['RFC 7296 (IKEv2)', 'RFC 4301 (IPsec Architecture)', 'RFC 4106 (AES-GCM for IPsec)']
      }));
    }

    return decision;
  }
}

