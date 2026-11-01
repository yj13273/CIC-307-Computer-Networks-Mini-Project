/**
 * Decision Record Representation
 * Conforms to Decision Record Contract DEC-001
 */

export class DecisionRecord {
  constructor({
    id,
    domain,
    subjectId,
    outcome = {},
    rule = {},
    inputs = {},
    explanation = '',
    standards = [],
    assumptions = [],
    warnings = []
  }) {
    this.id = id || `dec-${domain}-${subjectId || Math.random().toString(36).substr(2, 6)}`;
    this.domain = domain; // 'physical-media' | 'vlsm-addressing' | 'l3-routing' | 'l2-switching' | 'security'
    this.subjectId = subjectId;
    this.outcome = outcome;
    this.rule = rule;
    this.inputs = inputs;
    this.explanation = explanation;
    this.standards = standards;
    this.assumptions = assumptions;
    this.warnings = warnings;
    this.timestamp = new Date().toISOString();
  }
}

