/**
 * NetArchitect Knowledge Base Repository
 * Complies with Frontend Contract FE-001 Section 3.1
 */

export const KNOWLEDGE_ARTICLES = [
  {
    id: 'kb-physical-media',
    title: 'Physical Media & Optical Dispersion Physics',
    category: 'Physical Layer (L1)',
    status: 'Implemented',
    description: 'Algorithmic media selection between Category 6A copper, OM4 Multimode Fiber, and OS2 Single-Mode Fiber.',
    content: `
### 1. Architectural Principles
Physical media selection is fundamentally constrained by signal attenuation, high-frequency electromagnetic dispersion, and transceiver optical link budgets. NetArchitect applies three deterministic boundary thresholds derived from IEEE 802.3 standards.

### 2. Decision Boundaries & Standards
- **Runs ≤ 100 meters (LAN Horizontal & Access):**
  - **Selected Medium:** Category 6A (Cat6a) UTP/STP Copper.
  - **Standard:** IEEE 802.3an (10GBASE-T).
  - **Physical Justification:** High-frequency signaling up to 500 MHz over balanced 4-pair copper without alien crosstalk. Beyond 100m, high-frequency signal attenuation causes complete link loss.
- **Runs 101 to 400 meters (Building Backbone):**
  - **Selected Medium:** OM4 Laser-Optimized Multimode Fiber (50/125 μm).
  - **Standard:** IEEE 802.3ae (10GBASE-SR).
  - **Physical Justification:** Utilizes 850nm VCSEL transmitters. OM4 provides an Effective Modal Bandwidth (EMB) of 4700 MHz·km, preventing inter-symbol interference up to 400m at 10Gbps.
- **Runs > 400 meters (Metropolitan MAN & Global WAN):**
  - **Selected Medium:** OS2 Low Water Peak Single-Mode Fiber (9/125 μm).
  - **Standards:** IEEE 802.3ae (10GBASE-LR/ER), ITU-T G.652.D.
  - **Physical Justification:** 9μm glass core restricts light transmission to a single spatial mode, completely eliminating modal dispersion. Attenuation is ~0.4 dB/km at 1310nm and ~0.25 dB/km at 1550nm.

### 3. Formulas & Optical Power Budget
$$\\text{Total Link Loss } (\\text{dB}) = (\\alpha \\times L) + (N_c \\times L_c) + (N_s \\times L_s)$$
Where:
- $\\alpha$: Fiber attenuation coefficient (dB/km)
- $L$: Total physical length (km)
- $N_c, L_c$: Number and loss of connectors (~0.5 dB/connector)
- $N_s, L_s$: Number and loss of fusion splices (~0.1 dB/splice)
    `,
    rules: ['MEDIA_COPPER_LE_100M', 'MEDIA_MMF_101_TO_400M', 'MEDIA_SMF_OVER_400M', 'PHYSICAL_DISTANCE_VIOLATION'],
    standards: ['IEEE 802.3an', 'IEEE 802.3ae', 'ISO/IEC 11801 OM4', 'ITU-T G.652.D']
  },
  {
    id: 'kb-vlsm-math',
    title: 'Variable Length Subnet Masking (VLSM) & Bitwise Math',
    category: 'Network Layer (L3)',
    status: 'Implemented',
    description: 'Bitwise address space allocation, host requirement calculations, and boundary alignment.',
    content: `
### 1. Bitwise Allocation Algorithm
NetArchitect enforces Classless Inter-Domain Routing (RFC 4632) and Variable Length Subnet Masking (RFC 1878) using descending priority host packing to eliminate fragmentation.

### 2. Host Sizing Mathematical Rule
To determine the required host bit length $h$ for $N$ usable endpoints:
$$2^h - 2 \\ge N \\implies h = \\lceil \\log_2(N + 2) \\rceil$$
The assigned CIDR prefix length is:
$$P = 32 - h$$
The block size in total IP addresses is $B = 2^h$.

### 3. Boundary Alignment Invariant
Every allocated subnet starting address $A_{\\text{start}}$ must satisfy:
$$A_{\\text{start}} \\equiv 0 \\pmod B$$
If the previous subnet ended at address $E$, the next subnet begins at the next multiple of $B$:
$$A_{\\text{start}} = \\lceil (E + 1) / B \\rceil \\times B$$

### 4. Utilization Metric
$$\\text{Host Efficiency (\\%)} = \\frac{\\sum N_{\\text{requested}}}{\\sum (2^{h_i} - 2)} \\times 100$$
    `,
    rules: ['VLSM_DESCENDING_POWER_OF_2_PACKING', 'SUBNET_SPACE_EXHAUSTION'],
    standards: ['RFC 1878', 'RFC 4632', 'RFC 3021']
  },
  {
    id: 'kb-routing-protocols',
    title: 'Dynamic Routing: Single-Area vs Multi-Area OSPF & eBGP',
    category: 'Routing Protocols',
    status: 'Implemented',
    description: 'Link-state shortest path first (SPF) convergence, area hierarchy, and exterior cloud peering.',
    content: `
### 1. Interior Gateway Protocol: OSPFv2 (RFC 2328)
- **Single Autonomous System (<50 Subnets):** Configures single backbone Area 0. OSPF synchronizes identical Link-State Databases (LSDB) using Dijkstra's algorithm. For campus deployments, Area 0 avoids inter-area summarization overhead while delivering sub-second convergence.
- **Multi-Site & Multi-Region Enterprise:** Configures Multi-Area OSPF. Area 0 serves as the transit core backbone; Area 1 (EMEA) and Area 2 (APAC) partition link-state advertisements (LSAs). A link flap in Singapore is contained in Area 2, preventing worldwide router recalculation.

### 2. Exterior Peering: eBGP (RFC 4271)
At the multi-cloud perimeter (AWS Transit Gateway), external BGP peers between Enterprise Autonomous System (AS 65000) and AWS Cloud (AS 64512). Route summarization advertises a aggregated /14 CIDR supernet, hiding internal network changes from the cloud routing table.
    `,
    rules: ['ROUTING_SINGLE_AS_OSPF_AREA_0', 'ROUTING_METRO_MAN_BFD_QOS', 'ROUTING_MULTI_AREA_OSPF_EBGP_SUMMARIZATION'],
    standards: ['RFC 2328', 'RFC 4271', 'RFC 5880']
  },
  {
    id: 'kb-switching-vlan',
    title: 'Layer 2 Segmentation, 802.1Q & Rapid Spanning Tree',
    category: 'Data Link Layer (L2)',
    status: 'Implemented',
    description: 'VLAN tagging, trunking encapsulation, and Rapid Spanning Tree loop prevention.',
    content: `
### 1. IEEE 802.1Q VLAN Segmentation
Virtual LANs partition broadcast domains at Layer 2. NetArchitect configures dedicated VLAN tags across inter-switch trunks, allowing multiple isolated logical networks (e.g., Student, Faculty, VoIP, Management) over redundant physical links.

### 2. Rapid Spanning Tree Protocol (IEEE 802.1w / Rapid-PVST+)
Legacy 802.1D Spanning Tree requires 30 to 50 seconds to transition through Listening and Learning states before forwarding. RSTP achieves convergence under 1 second via point-to-point handshake proposals and immediate root port transitions. Access ports enable **PortFast** and **BPDU Guard** to prevent user loops.
    `,
    rules: ['SWITCHING_8021Q_RSTP_POE', 'SWITCHING_VRF_SEGMENTATION'],
    standards: ['IEEE 802.1Q', 'IEEE 802.1w', 'IEEE 802.3bt']
  },
  {
    id: 'kb-security-vpn',
    title: 'Network Security: Extended ACLs & IPsec IKEv2',
    category: 'Network Security',
    status: 'Implemented',
    description: 'Zero-trust Layer 3/4 access control filtering and wire-speed cryptographic tunnels.',
    content: `
### 1. Extended Access Control Lists (ACLs)
Applied inbound on Switch Virtual Interfaces (SVIs) and WAN edge routers. Extended ACLs evaluate source IP, destination IP, protocol, and port numbers to isolate high-risk zones (such as student Wi-Fi or IoT scanner fleets) from confidential servers and management interfaces.

### 2. IPsec VPN Architecture (RFC 7296)
For WAN links traversing public transport:
- **Phase 1 (IKEv2):** Elliptic Curve Diffie-Hellman Group 19, PRF SHA-384, Pre-Shared Key / Certificate auth.
- **Phase 2 (ESP):** Authenticated encryption using AES-256-GCM (Galois/Counter Mode). GCM combines encryption and integrity in a single hardware cycle.
    `,
    rules: ['SEC_CAMPUS_ZERO_TRUST_SVI', 'SEC_METRO_FINTECH_MACSEC', 'SEC_GLOBAL_WAN_IPSEC_IKEV2'],
    standards: ['RFC 7296', 'RFC 4301', 'RFC 4106']
  },
  {
    id: 'kb-system-architecture',
    title: 'NetArchitect System Architecture & Pipeline',
    category: 'System Architecture',
    status: 'Implemented',
    description: 'Ingestion, normalization, rule engines, decision logging, and configuration assembly.',
    content: `
### Architecture Flow
1. **Input Ingestion:** Loads preset or custom scenario parameters.
2. **Adapter Normalization:** Converts scenario format into canonical Common Network Model.
3. **Model Validation:** Verifies structural, referential, value, and physical constraints.
4. **L1 Media Engine:** Computes distance physics and assigns Cat6a, OM4 MMF, or OS2 SMF.
5. **L3 VLSM Engine:** Performs descending bitwise subnet allocation and computes masks.
6. **L3/L2 Routing & Switching Engines:** Evaluates OSPF, BGP, RSTP, and SVI requirements.
7. **Explainability & Config Exporter:** Assembles copy-paste ready Cisco IOS configurations and structured audit records.
    `,
    rules: ['SYS_PIPELINE_ORCHESTRATION'],
    standards: ['NetArchitect Engineering Contract v1.0']
  }
];

