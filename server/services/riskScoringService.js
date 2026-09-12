/**
 * BugBounty Risk-Scoring Engine
 *
 * Deterministic, transparent, and explainable vulnerability risk assessment.
 * Inspired by CVSS v3.1 base metric scoring principles.
 */

export const RISK_FACTORS = {
  impact: {
    none: { weight: 0.0, label: 'No Impact' },
    low: { weight: 2.5, label: 'Low Impact (Minor non-sensitive component)' },
    medium: { weight: 5.0, label: 'Medium Impact (Service disruption or partial data read)' },
    high: { weight: 7.5, label: 'High Impact (Extensive data breach or system compromise)' },
    critical: { weight: 10.0, label: 'Critical Impact (Full system takeover or total data exposure)' },
  },
  exploitability: {
    unproven: { multiplier: 0.8, label: 'Theoretical / Unproven exploit' },
    poc: { multiplier: 0.95, label: 'Proof-of-Concept demonstration available' },
    functional: { multiplier: 1.05, label: 'Functional autonomous exploit code exists' },
    high: { multiplier: 1.2, label: 'Weaponized exploit actively observed in the wild' },
  },
  attackVector: {
    physical: { multiplier: 0.3, label: 'Physical device access required' },
    local: { multiplier: 0.6, label: 'Local console/shell access required' },
    adjacent_network: { multiplier: 0.8, label: 'Adjacent subnet / VPN access required' },
    network: { multiplier: 1.0, label: 'Remotely exploitable over public internet' },
  },
  dataExposure: {
    none: { bonus: 0.0, label: 'No data exposed' },
    internal_non_sensitive: { bonus: 0.8, label: 'Internal non-sensitive telemetry / logs' },
    pii_confidential: { bonus: 2.0, label: 'Personally Identifiable Information (PII) / Confidential records' },
    credentials_financial: { bonus: 3.5, label: 'Plaintext credentials, financial tokens, or API keys' },
  },
  authRequirements: {
    admin_privileged: { multiplier: 0.5, label: 'Administrative / Highly privileged account required' },
    authenticated_user: { multiplier: 0.75, label: 'Standard authenticated user account required' },
    none_unauthenticated: { multiplier: 1.0, label: 'Zero authentication required (Anonymous public attacker)' },
  },
};

/**
 * Calculates a deterministic, explainable risk score from inputs.
 *
 * @param {Object} factors
 * @param {string} [factors.impact='medium']
 * @param {string} [factors.exploitability='poc']
 * @param {string} [factors.attackVector='network']
 * @param {string} [factors.dataExposure='none']
 * @param {string} [factors.authRequirements='none_unauthenticated']
 * @returns {Object} Comprehensive risk scoring assessment
 */
export const calculateRiskScore = (factors = {}) => {
  const impactKey = String(factors.impact || 'medium').toLowerCase();
  const exploitabilityKey = String(factors.exploitability || 'poc').toLowerCase();
  const attackVectorKey = String(factors.attackVector || 'network').toLowerCase();
  const dataExposureKey = String(factors.dataExposure || 'none').toLowerCase();
  const authRequirementsKey = String(factors.authRequirements || 'none_unauthenticated').toLowerCase();

  const impact = RISK_FACTORS.impact[impactKey] || RISK_FACTORS.impact.medium;
  const exploitability = RISK_FACTORS.exploitability[exploitabilityKey] || RISK_FACTORS.exploitability.poc;
  const attackVector = RISK_FACTORS.attackVector[attackVectorKey] || RISK_FACTORS.attackVector.network;
  const dataExposure = RISK_FACTORS.dataExposure[dataExposureKey] || RISK_FACTORS.dataExposure.none;
  const authRequirements = RISK_FACTORS.authRequirements[authRequirementsKey] || RISK_FACTORS.authRequirements.none_unauthenticated;

  // Formula: Base = (Impact * Exploitability * AttackVector * AuthRequirements) + DataExposure
  const rawScore = (impact.weight * exploitability.multiplier * attackVector.multiplier * authRequirements.multiplier) + dataExposure.bonus;

  // Clamp strictly between 0.0 and 10.0, rounded to 1 decimal place
  const score = Math.round(Math.max(0.0, Math.min(10.0, rawScore)) * 10) / 10;

  let riskBand = 'Low';
  let severityRecommendation = 'low';

  if (score === 0.0) {
    riskBand = 'None';
    severityRecommendation = 'low';
  } else if (score < 4.0) {
    riskBand = 'Low';
    severityRecommendation = 'low';
  } else if (score < 7.0) {
    riskBand = 'Medium';
    severityRecommendation = 'medium';
  } else if (score < 9.0) {
    riskBand = 'High';
    severityRecommendation = 'high';
  } else {
    riskBand = 'Critical';
    severityRecommendation = 'critical';
  }

  return {
    score,
    riskBand,
    severityRecommendation,
    breakdown: {
      formula: 'Score = clamp((Impact * Exploitability * AttackVector * AuthReqs) + DataExposure, 0.0, 10.0)',
      impactScore: impact.weight,
      exploitabilityMultiplier: exploitability.multiplier,
      attackVectorMultiplier: attackVector.multiplier,
      authMultiplier: authRequirements.multiplier,
      dataExposureBonus: dataExposure.bonus,
      rawScore: Math.round(rawScore * 100) / 100,
    },
    factors: {
      impact: impactKey,
      exploitability: exploitabilityKey,
      attackVector: attackVectorKey,
      dataExposure: dataExposureKey,
      authRequirements: authRequirementsKey,
    },
  };
};
