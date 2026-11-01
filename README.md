# NetArchitect: Recommendation & Config Engine

**Course Code:** CIC-307 • Computer Networks Mini-Project  
**Author / Team:** NetArchitect Engineering Team  
**Evaluation Weight:** 100 Points  

An algorithmic network planning and self-explaining architecture engine developed in pure **Vanilla HTML, CSS, and Modern JavaScript (ES Modules)** — with zero React or external heavyweight dependencies.

---

## 🚀 How to Run

Because NetArchitect is built strictly in standard native HTML5 and JavaScript ES Modules:

### Option 1: Using any Static Web Server (Recommended)
You can serve the directory using any static web server:
- With Python:
  ```bash
  python -m http.server 3000
  ```
- With Node / NPX:
  ```bash
  npx serve .
  # or
  npx vite
  ```
- With VS Code:
  Right-click `index.html` and select **"Open with Live Server"**.

Open your browser at `http://localhost:3000`.

---

## 🏛️ System Architecture & Workflow

NetArchitect implements the complete four-stage pipeline defined in the CIC-307 assignment specification:

```
+-----------------------------------------------------------------------------------+
| 1. Input Ingestion     Preset / Custom JSON Parameters                            |
+-----------------------------------------------------------------------------------+
                                        |
                                        v
+-----------------------------------------------------------------------------------+
| 2. L1 Media Engine     Distance & Bandwidth Physics (Cat6a vs OM4 MMF vs OS2 SMF) |
+-----------------------------------------------------------------------------------+
                                        |
                                        v
+-----------------------------------------------------------------------------------+
| 3. L3 VLSM Engine      Bitwise Descending Subnet Allocator & Routing Engine       |
+-----------------------------------------------------------------------------------+
                                        |
                                        v
+-----------------------------------------------------------------------------------+
| 4. Explainable Exporter Config Generator (Cisco IOS) + Architectural Decision Log |
+-----------------------------------------------------------------------------------+
```

---

## 📑 Feature Highlights & Rubric Alignment

| Assessment Rubric Area | Points | Implementation in NetArchitect |
|---|---|---|
| **1. Parameter Engine & Presets** | 15 Pts | Implements all 3 preset enterprise profiles (`campus-lan`, `metro-man`, `global-wan`) with normalized Common Network Models and boundary validation. |
| **2. Explainable Decision Engine** | 25 Pts | Generates natural-language engineering justifications quoting IEEE 802.3 channel length limits, 850nm modal dispersion limits, optical link power budgets, and RFC standards for every decision. |
| **3. Subnet Engine & Configs** | 25 Pts | Dynamic bitwise VLSM allocation with zero overlap, calculating network/broadcast addresses, netmasks, and Cisco IOS inverted wildcard masks. Generates copy-paste ready Cisco IOS XE configs. |
| **4. Automated Testing & Defenses** | 15 Pts | Comprehensive test suites and boundary test bench covering distance violations (`PhysicalDistanceViolationError`), subnet exhaustion, and wildcard mask accuracy. |
| **5. AI Code Audit & Defense** | 20 Pts | Detailed technical post-mortems in `docs/ai_audit_log.md` detailing prompt, buggy AI code, technical packet-flow analysis, and verified remediation. |

---

## 📂 Project Structure

```
├── contracts/               # Architecture, Common Model, Decision Record & Frontend Contracts
├── docs/
│   ├── ai_audit_log.md      # Mandatory AI Defense & Code Auditing Log (20 Pts)
│   ├── architecture.md      # Architectural design notes
│   └── plan.md              # Project plan
├── exports/                 # Verified Cisco IOS configuration files for Packet Tracer / GNS3
│   ├── campus-lan-verification.txt
│   ├── metro-man-verification.txt
│   └── global-wan-verification.txt
├── src/
│   ├── data/scenarios/      # Preset JSON scenario definitions and JS exports
│   ├── utils/               # Bitwise IP math, VLSM allocator, unit conversions
│   ├── core/
│   │   ├── adapters/        # Profile adapters (Campus, Metro, Global)
│   │   ├── model/           # Common Network Model classes & factories
│   │   ├── validation/      # Physical distance & schema validators
│   │   ├── decisions/       # Decision logger & algorithmic rule engines
│   │   ├── config-generator/# Cisco IOS Switch, Router, SVI & ACL config generators
│   │   └── architecture-service.js # Central orchestrator contract
│   ├── ui/
│   │   ├── app/             # App shell, navigation, state store
│   │   ├── knowledge-base/  # 9 rich engineering articles with formulas & RFCs
│   │   ├── architect/       # Stages A, B, C, D workflow & visual SVG topology
│   │   ├── diagnostics/     # Centralized error table & boundary simulation sandbox
│   │   ├── sessions/        # Persistent IndexedDB session drawer & comparison tool
│   │   └── styles/          # Light-first monochrome CSS design system
│   └── main.js              # Native ES module bootstrap
├── tests/integration/       # Integration tests covering presets, edge cases, and errors
├── index.html               # Main application entry point
├── package.json             # NPM package descriptor
└── vite.config.js           # Optional Vite configuration
```

