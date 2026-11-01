/**
 * Architecture Service Orchestrator
 * Implements Architecture Service Contract FE-001 / ASC-001
 * Coordinates loader -> adapters -> validation -> engines -> explainability -> config generator
 */
import { getScenarioById, PRESET_SCENARIOS } from '../data/scenarios/scenarios-data.js';
import { adaptCampusScenario } from './adapters/campus-adapter.js';
import { adaptMetroScenario } from './adapters/metro-adapter.js';
import { adaptGlobalScenario } from './adapters/global-wan-adapter.js';
import { validateRawScenario } from './validation/validate-scenario.js';
import { validateNetworkModel } from './validation/validate-model.js';
import { allocateVlsm } from '../utils/subnet-math.js';
import { DecisionLogger } from './decisions/decision-logger.js';
import { assembleConfigurations } from './config-generator/config-assembler.js';

export async function generateArchitecture(profileId, customScenario = null) {
  const startTime = Date.now();
  const logger = new DecisionLogger();

  try {
    // 1. Ingest scenario
    let rawScenario;
    if (customScenario) {
      rawScenario = JSON.parse(JSON.stringify(customScenario));
    } else {
      rawScenario = getScenarioById(profileId);
    }

    // 2. Validate raw scenario
    const rawVal = validateRawScenario(rawScenario);
    if (!rawVal.valid) {
      return {
        status: 'error',
        profileId: profileId || 'unknown',
        displayName: 'Scenario Ingestion Failed',
        validation: {
          errors: rawVal.issues.filter(i => i.severity === 'error'),
          warnings: rawVal.issues.filter(i => i.severity === 'warning')
        },
        diagnostics: rawVal.issues,
        analysis: null,
        decisions: [],
        configurations: [],
        assumptions: [],
        warnings: ['Scenario schema validation failed before adapter conversion.'],
        executionTimeMs: Date.now() - startTime
      };
    }

    // 3. Adapter selection and normalization
    const activeProfileId = rawScenario.profileId;
    let normalizedModel;

    switch (activeProfileId) {
      case 'campus-lan':
        normalizedModel = adaptCampusScenario(rawScenario);
        break;
      case 'metro-man':
        normalizedModel = adaptMetroScenario(rawScenario);
        break;
      case 'global-wan':
        normalizedModel = adaptGlobalScenario(rawScenario);
        break;
      default:
        throw new Error(`Unsupported profile ID: ${activeProfileId}`);
    }

    // 4. Validate Common Network Model
    const modelVal = validateNetworkModel(normalizedModel);
    modelVal.issues.forEach(diag => logger.addDiagnostic(diag));

    // If blocking errors exist, stop and return diagnostics
    if (!modelVal.valid) {
      return {
        status: 'error',
        profileId: activeProfileId,
        displayName: normalizedModel.displayName || activeProfileId,
        inputSummary: {
          sitesCount: normalizedModel.sites.length,
          devicesCount: normalizedModel.devices.length,
          linksCount: normalizedModel.links.length
        },
        validation: {
          errors: modelVal.errors,
          warnings: modelVal.warnings
        },
        diagnostics: logger.diagnostics,
        analysis: null,
        decisions: logger.decisions,
        configurations: [],
        assumptions: normalizedModel.assumptions || [],
        warnings: ['Network model validation produced blocking errors.'],
        executionTimeMs: Date.now() - startTime
      };
    }

    // 5. Execute Physical Media Decision Engine (L1)
    const mediaAnalysis = logger.evaluatePhysicalMedia(normalizedModel.links);

    // 6. Execute L3 VLSM Bitwise Subnet Allocator
    const rootCidr = normalizedModel.addressing?.rootPrefix || '10.0.0.0/16';
    const subnetRequests = normalizedModel.addressing?.subnetRequests || [];
    
    let vlsmResult;
    try {
      vlsmResult = allocateVlsm(rootCidr, subnetRequests);
      
      // Log VLSM Decision
      logger.addDecision({
        id: `dec-vlsm-${activeProfileId}`,
        domain: 'vlsm-addressing',
        subjectId: rootCidr,
        outcome: {
          allocatedSubnets: vlsmResult.allocations.length,
          efficiencyPct: vlsmResult.efficiencyPct,
          rootUtilizationPct: vlsmResult.rootUtilizationPct
        },
        rule: {
          id: 'VLSM_DESCENDING_POWER_OF_2_PACKING',
          description: 'Sort requests descending, align to power-of-2 boundaries without overlap'
        },
        inputs: {
          rootPrefix: rootCidr,
          totalSubnets: subnetRequests.length,
          totalHostsRequested: vlsmResult.totalRequestedHosts
        },
        explanation: vlsmResult.rationale,
        standards: ['RFC 1878 (Variable Length Subnet Masks)', 'RFC 4632 (CIDR)'],
        assumptions: [],
        warnings: []
      });
    } catch (vlsmErr) {
      logger.addDiagnostic({
        id: `diag-vlsm-${Date.now()}`,
        code: vlsmErr.code || 'SUBNET_ALLOCATION_FAILED',
        severity: 'error',
        description: vlsmErr.message,
        affectedEntity: rootCidr,
        suggestedResolution: 'Expand root prefix or reduce requested host counts per subnet.',
        relatedEngine: 'vlsm-addressing'
      });

      return {
        status: 'error',
        profileId: activeProfileId,
        displayName: normalizedModel.displayName,
        validation: { errors: [vlsmErr.message], warnings: [] },
        diagnostics: logger.diagnostics,
        analysis: null,
        decisions: logger.decisions,
        configurations: [],
        assumptions: normalizedModel.assumptions || [],
        warnings: [vlsmErr.message],
        executionTimeMs: Date.now() - startTime
      };
    }

    // 7. Execute L3 Routing Decision Engine
    const routingDecision = logger.evaluateRouting(normalizedModel, vlsmResult);

    // 8. Execute L2 Switching Decision Engine
    const switchingDecision = logger.evaluateSwitching(normalizedModel);

    // 9. Execute Security & ACL Decision Engine
    const securityDecision = logger.evaluateSecurity(normalizedModel);

    // 10. Generate Cisco IOS Configurations
    const configurations = assembleConfigurations(normalizedModel, vlsmResult);

    // 11. Aggregate and return result
    return {
      status: 'success',
      profileId: activeProfileId,
      displayName: normalizedModel.displayName,
      scope: normalizedModel.scope,
      description: normalizedModel.description,
      inputSummary: {
        sitesCount: normalizedModel.sites.length,
        devicesCount: normalizedModel.devices.length,
        linksCount: normalizedModel.links.length,
        endpointsCount: (normalizedModel.endpointGroups || []).reduce((acc, ep) => acc + (ep.count || 0), 0),
        rootPrefix: rootCidr
      },
      validation: {
        errors: logger.diagnostics.filter(d => d.severity === 'error'),
        warnings: logger.diagnostics.filter(d => d.severity === 'warning'),
        info: logger.diagnostics.filter(d => d.severity === 'info')
      },
      diagnostics: logger.diagnostics,
      analysis: {
        media: {
          links: mediaAnalysis,
          summary: `${mediaAnalysis.length} physical links evaluated against IEEE 802.3 and ITU standards.`
        },
        topology: {
          sites: normalizedModel.sites,
          devices: normalizedModel.devices,
          links: normalizedModel.links,
          resiliency: normalizedModel.resiliency
        },
        addressing: vlsmResult,
        routing: {
          decision: routingDecision,
          details: normalizedModel.routing
        },
        switching: {
          decision: switchingDecision,
          details: normalizedModel.switching
        },
        security: {
          decision: securityDecision,
          details: normalizedModel.security
        }
      },
      decisions: logger.decisions,
      configurations,
      assumptions: normalizedModel.assumptions || [],
      warnings: logger.diagnostics.filter(d => d.severity === 'warning').map(w => w.description),
      executionTimeMs: Date.now() - startTime
    };
  } catch (err) {
    return {
      status: 'error',
      profileId: profileId || 'unknown',
      displayName: 'Architecture Generation Error',
      validation: { errors: [err.message], warnings: [] },
      diagnostics: [
        {
          id: `diag-fatal-${Date.now()}`,
          code: 'EXECUTION_EXCEPTION',
          severity: 'error',
          description: err.message,
          affectedEntity: 'architecture-service',
          suggestedResolution: 'Check console logs and scenario structure.'
        }
      ],
      analysis: null,
      decisions: logger.decisions,
      configurations: [],
      assumptions: [],
      warnings: [err.message],
      executionTimeMs: Date.now() - startTime
    };
  }
}

