# AI Code Audit & Defense Log (`ai_audit_log.md`)
**Course Code:** CIC-307 • Computer Networks Mini-Project  
**System:** NetArchitect Algorithmic Recommendation & Config Engine  
**Standard:** Mandatory AI Defense & Code Auditing Protocol (Rubric Area 5 — 20 Points)

---

## Executive Summary
This document provides a post-mortem defense analysis of two critical networking defects and hallucinations produced during generative AI code generation. As Lead Network Architects and Validators, our evaluation detected and remediated these flaws with packet flow analysis, RFC citations, and mathematical proofs.

---

## Case Study 1: Flawed Bitwise Subnet Wildcard Mask Inversion in Cisco OSPF Configuration

### 1. The Prompt
> *"Generate dynamic Cisco IOS OSPF router configuration statements for a list of allocated VLSM subnets, calculating the network address and mask for each."*

### 2. Flawed AI-Generated Code
```python
# Buggy AI Code: Hallucinated netmask instead of bitwise inverted wildcard mask
def generate_ospf_statement(subnet_ip, prefix_length):
    # Generates standard dotted-decimal netmask
    mask = cidr_to_netmask(prefix_length)
    # Hallucination: Placed standard netmask directly into OSPF network statement
    return f"network {subnet_ip} {mask} area 0"

# Example output generated:
# "network 10.10.4.0 255.255.254.0 area 0"
```

### 3. Technical Diagnosis & Packet Flow Analysis
- **Cisco IOS Syntax Violation:** In Cisco IOS OSPF syntax (`network <ip> <wildcard-mask> area <area-id>`), the parameter following the network address is an inverted **wildcard mask** (host mask), *not* a subnet mask.
- **Packet Flow Failure:** 
  When `network 10.10.4.0 255.255.254.0 area 0` is applied to a Cisco IOS-XE router:
  - Cisco IOS treats `255.255.254.0` as a bitwise match condition where `0` means *"must match"* and `1` means *"do not care"*.
  - Octets 1 and 2 (`255.255`) become *"wildcards/do not care"*, matching any IP in `*. *. 4. 0`!
  - Consequently, interfaces intended to remain outside OSPF (such as public WAN perimeter interfaces or isolated DMZ links) inadvertently match the wildcard, participate in OSPF hello exchanges, form unauthorized adjacencies, and leak interior routing topologies to untrusted transit networks.
- **Mathematical Correction:**
  The true wildcard mask $W$ is the bitwise one's complement of the subnet mask $M$:
  $$W = (\sim M) \pmod{2^{32}} = 255.255.255.255 - M$$
  For a `/23` subnet ($M = 255.255.254.0$):
  $$W = (255 - 255) . (255 - 255) . (255 - 254) . (255 - 0) = 0.0.1.255$$

### 4. Remediation & Final Fix
We replaced the hallucinated mask logic with explicit bitwise bit-shifting inversion:
```javascript
export function cidrToWildcardStr(prefixLen) {
  const maskInt = cidrToNetmaskInt(prefixLen);
  const wildcardInt = (~maskInt) >>> 0;
  return intToIp(wildcardInt);
}

// Correct Cisco IOS statement:
// "network 10.10.4.0 0.0.1.255 area 0"
```

---

## Case Study 2: Optical Dispersion Hallucination on Long-Distance Inter-Site Links

### 1. The Prompt
> *"Recommend optimal physical media and transceivers for links between 500m and 3,000m running at 10 Gbps with minimum cost."*

### 2. Flawed AI-Generated Code
```javascript
// Buggy AI Code: Incorrectly recommended OM4 Multimode Fiber for a 1.8km link
function selectMedia(distanceMeters) {
  if (distanceMeters <= 100) {
    return { medium: "Cat6a", standard: "10GBASE-T" };
  } else if (distanceMeters <= 2000) {
    // Hallucination: Claimed OM4 MMF reaches 2km at 10G with 1310nm optics
    return { medium: "OM4 MMF", standard: "10GBASE-LR", wavelength: "1310nm" };
  } else {
    return { medium: "OS2 SMF", standard: "10GBASE-ER" };
  }
}
```

### 3. Technical Diagnosis & Physics Analysis
- **Violations of Optical Physics (IEEE 802.3ae / ISO/IEC 11801):**
  1. **Modal Dispersion Limit:** OM4 is a 50/125 μm graded-index multimode fiber engineered specifically for **850nm VCSEL** transceivers (`10GBASE-SR`). Its Effective Modal Bandwidth (EMB) is standardized at $4,700 \text{ MHz}\cdot\text{km}$.
  2. At 10 Gbps, differential mode delay (DMD) spreads optical pulses across multiple propagation paths. The strict mathematical distance ceiling for OM4 at 10 Gbps is **400 meters**. Beyond 400m, pulse spreading causes inter-symbol interference (ISI) and total link down states.
  3. **Wavelength Mismatch:** `10GBASE-LR` is a single-mode standard designed for 9/125 μm OS1/OS2 glass at 1310nm with Fabry-Pérot or DFB lasers. Injecting a single-mode laser into a 50μm multimode core induces catastrophic modal noise and severe coupling loss.
- **Physical Boundary Verification:**
  - For link runs $> 400\text{m}$, **OS2 Single-Mode Fiber (SMF)** is mandatory.
  - OS2 SMF confines propagation to the fundamental $HE_{11}$ spatial mode, eliminating modal dispersion.

### 4. Remediation & Final Fix
We implemented deterministic boundary checking with explicit optical dispersion rationale:
```javascript
if (distance <= 100) {
  // Cat6a 10GBASE-T (IEEE 802.3an)
} else if (distance > 100 && distance <= 400) {
  // OM4 MMF 10GBASE-SR (850nm VCSEL, 4700 MHz·km EMB)
} else {
  // OS2 SMF 10GBASE-LR/ER (9μm single-mode core, zero modal dispersion)
}
```

---

## Case Study 3: Unconstrained 802.1Q Switchport Trunking Vulnerability

### 1. The Prompt
> *"Generate Cisco IOS switchport configuration for interconnecting distribution switches."*

### 2. Flawed AI-Generated Code
```text
interface TenGigabitEthernet1/1/1
 switchport mode trunk
 no shutdown
```

### 3. Technical Diagnosis & Security Vulnerability
- By omitting `switchport trunk allowed vlan` and `switchport nonegotiate`, the AI code creates two high-severity vulnerabilities:
  1. **VLAN Hopping (CVE-2001-0860):** With all VLANs allowed by default and Dynamic Trunking Protocol (DTP) active, untrusted native VLAN 1 packets with double 802.1Q tags can hop across switches into sensitive management networks.
  2. **Broadcast Storm Propagation:** Unconstrained trunks flood broadcast, multicast, and unknown unicast (BUM) traffic across all VLANs, exhausting backplane buffers.

### 4. Remediation & Final Fix
We added explicit trunk pruning and disabled DTP:
```text
interface TenGigabitEthernet1/1/1
 description Inter-Switch Distribution Trunk
 switchport trunk encapsulation dot1q
 switchport mode trunk
 switchport trunk allowed vlan 10,20,30,40,99
 switchport nonegotiate
 spanning-tree link-type point-to-point
 no shutdown
```

