/**
 * Validation Error Types conforming to PDF specification and validation contract
 */

export class PhysicalDistanceViolationError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'PhysicalDistanceViolationError';
    this.code = 'PHYSICAL_DISTANCE_VIOLATION';
    this.severity = 'error';
    this.details = details;
  }
}

export class ValidationError extends Error {
  constructor(message, errors = []) {
    super(message);
    this.name = 'ValidationError';
    this.code = 'MODEL_VALIDATION_ERROR';
    this.severity = 'error';
    this.errors = errors;
  }
}

export function createDiagnostic({
  id,
  code,
  severity = 'error',
  description,
  affectedEntity = 'system',
  expectedConstraint = '',
  actualValue = '',
  suggestedResolution = '',
  relatedEngine = 'validation',
  relatedDecisionId = null
}) {
  return {
    id: id || `diag-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    code,
    severity, // 'error' | 'warning' | 'info'
    description,
    affectedEntity,
    expectedConstraint,
    actualValue,
    suggestedResolution,
    relatedEngine,
    relatedDecisionId
  };
}

