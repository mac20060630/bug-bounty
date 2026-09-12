import React, { useState } from 'react';
import { ShieldAlert, ChevronDown, ChevronUp, Cpu, Info, CheckCircle2 } from 'lucide-react';
import Badge from './Badge';

export const RiskScoreInspector = ({ riskAssessment, severity, riskScore }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!riskAssessment && !riskScore) return null;

  const score = riskAssessment?.score ?? riskScore ?? 5.0;
  const band = riskAssessment?.riskBand || (score >= 9 ? 'Critical' : score >= 7 ? 'High' : score >= 4 ? 'Medium' : 'Low');
  const breakdown = riskAssessment?.breakdown;
  const factors = riskAssessment?.factors;

  const getScoreColor = (sc) => {
    if (sc >= 9.0) return 'text-red-400 border-red-500/40 bg-red-500/10';
    if (sc >= 7.0) return 'text-orange-400 border-orange-500/40 bg-orange-500/10';
    if (sc >= 4.0) return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
    return 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10';
  };

  return (
    <div className="glass-panel p-5 rounded-2xl border border-cyber-border/80 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
            <Cpu className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>Deterministic Risk-Scoring Engine</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                v4.0
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Explainable metric calculation & administrative severity guidance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={`px-3 py-1 rounded-xl border text-xs font-mono font-black ${getScoreColor(score)}`}>
            {score.toFixed(1)} / 10.0
          </div>
          <Badge variant={band === 'Critical' ? 'danger' : band === 'High' ? 'warning' : 'admin'} size="xs">
            {band} Risk
          </Badge>
        </div>
      </div>

      {/* Primary summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-mono block">Impact Factor</span>
          <span className="font-bold text-slate-200 capitalize">{factors?.impact || severity || 'Medium'}</span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-mono block">Exploitability</span>
          <span className="font-bold text-slate-200 capitalize">{factors?.exploitability || 'PoC demo'}</span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-mono block">Attack Vector</span>
          <span className="font-bold text-slate-200 capitalize">{factors?.attackVector?.replace(/_/g, ' ') || 'Network'}</span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-mono block">Auth Required</span>
          <span className="font-bold text-slate-200 capitalize">{factors?.authRequirements?.replace(/_/g, ' ') || 'None (Unauth)'}</span>
        </div>
      </div>

      {/* Expandable explainability drawer */}
      <div className="pt-1">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 focus:outline-none"
        >
          <span>{isExpanded ? 'Hide Calculation Breakdown' : 'View Explainable Scoring Formula & Math Breakdown'}</span>
          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>

        {isExpanded && breakdown && (
          <div className="mt-3 p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 text-xs font-mono">
            <div className="text-slate-300 space-y-1">
              <span className="text-cyan-400 font-bold block">Mathematical Scoring Formula:</span>
              <p className="text-[11px] text-slate-400 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                Score = min(10.0, (Impact × Exploitability × AttackVector × AuthReqs) + DataExposure)
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
              <div className="flex justify-between p-1.5 rounded bg-slate-900/40">
                <span>Base Impact Weight:</span>
                <span className="text-white font-bold">{breakdown.impactScore}</span>
              </div>
              <div className="flex justify-between p-1.5 rounded bg-slate-900/40">
                <span>Exploitability Multiplier:</span>
                <span className="text-white font-bold">{breakdown.exploitabilityMultiplier}x</span>
              </div>
              <div className="flex justify-between p-1.5 rounded bg-slate-900/40">
                <span>Attack Vector Multiplier:</span>
                <span className="text-white font-bold">{breakdown.attackVectorMultiplier}x</span>
              </div>
              <div className="flex justify-between p-1.5 rounded bg-slate-900/40">
                <span>Authentication Multiplier:</span>
                <span className="text-white font-bold">{breakdown.authMultiplier}x</span>
              </div>
              <div className="flex justify-between p-1.5 rounded bg-slate-900/40 sm:col-span-2">
                <span>Data Exposure Bonus:</span>
                <span className="text-white font-bold">+{breakdown.dataExposureBonus}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-cyan-950/20 border border-cyan-500/30 text-[11px] text-cyan-200 flex items-start gap-2">
              <Info className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                Recommended Severity: <strong className="text-white capitalize">{riskAssessment?.severityRecommendation || severity}</strong>.
                Administrators retain final authority to override severity during review.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RiskScoreInspector;
