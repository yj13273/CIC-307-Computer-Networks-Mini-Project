/**
 * Raw scenario validation before adapter ingestion
 */
import { createDiagnostic } from './validation-errors.js';

export function validateRawScenario(scenario) {
  const issues = [];

  if (!scenario || typeof scenario !== 'object') {
    issues.push(createDiagnostic({
      code: 'INVALID_SCENARIO_PAYLOAD',
      severity: 'error',
      description: 'Scenario data must be a valid JSON object.',
      affectedEntity: 'root'
    }));
    return { valid: false, issues };
  }

  if (!scenario.profileId || typeof scenario.profileId !== 'string') {
    issues.push(createDiagnostic({
      code: 'MISSING_PROFILE_ID',
      severity: 'error',
      description: 'Scenario missing required "profileId" identifier.',
      affectedEntity: 'profileId'
    }));
  }

  if (!scenario.parameters || typeof scenario.parameters !== 'object') {
    issues.push(createDiagnostic({
      code: 'MISSING_PARAMETERS',
      severity: 'error',
      description: 'Scenario missing root "parameters" object.',
      affectedEntity: 'parameters'
    }));
  }

  const valid = issues.filter(i => i.severity === 'error').length === 0;
  return { valid, issues };
}

