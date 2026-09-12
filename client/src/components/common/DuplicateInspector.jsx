import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Copy, ExternalLink, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import Badge from './Badge';

export const DuplicateInspector = ({ duplicateCheck }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!duplicateCheck) return null;

  const { highestSimilarity = 0, recommendation = 'unique', matches = [] } = duplicateCheck;

  // Only display highlight if similarity is notable
  const isDuplicateAlert = highestSimilarity >= 45;

  const getRecommendationBadge = () => {
    switch (recommendation) {
      case 'likely_duplicate':
        return <Badge variant="danger" size="xs">Likely Duplicate ({highestSimilarity}%)</Badge>;
      case 'possible_similarity':
        return <Badge variant="warning" size="xs">Potential Similarity ({highestSimilarity}%)</Badge>;
      default:
        return <Badge variant="admin" size="xs">Unique Finding (0% Matches)</Badge>;
    }
  };

  return (
    <div
      className={`p-5 rounded-2xl border transition-all ${
        isDuplicateAlert
          ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
          : 'glass-panel border-cyber-border/80 text-slate-300'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div
            className={`p-1.5 rounded-lg ${
              isDuplicateAlert ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {isDuplicateAlert ? <AlertTriangle className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Automated Duplicate & Similarity Screening
              </h3>
              {getRecommendationBadge()}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Multi-vector heuristic comparison on target asset, category, title, and reproduction payload
            </p>
          </div>
        </div>

        {matches.length > 0 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 shrink-0"
          >
            <span>{isExpanded ? 'Hide Potential Matches' : `Inspect Matches (${matches.length})`}</span>
            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>

      {isDuplicateAlert && (
        <div className="mt-3 p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-[11px] text-amber-300 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            <strong>Human-in-the-Loop Review Policy:</strong> This report has not been automatically rejected. Review the similarity breakdown below to determine if this is an authentic duplicate or distinct vulnerability.
          </span>
        </div>
      )}

      {/* Matches Drawer */}
      {isExpanded && matches.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
            Candidate Matching Submissions
          </span>

          <div className="space-y-2">
            {matches.map((m, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-amber-400 text-sm">
                      {m.similarityScore}%
                    </span>
                    <span className="font-semibold text-white truncate max-w-sm">
                      {m.title}
                    </span>
                    <Badge variant="neutral" size="xs">
                      {m.status}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 font-mono">
                    <span>Asset: {m.affectedAsset}</span>
                    <span>&bull;</span>
                    <span>Category: {m.category}</span>
                    <span>&bull;</span>
                    <span>
                      Matched vectors: <strong className="text-cyan-400">{m.matchedFields?.join(', ')}</strong>
                    </span>
                  </div>
                </div>

                <Link
                  to={`/reports/${m.reportId}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-semibold shrink-0 hover:underline"
                >
                  <span>Compare Dossier</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DuplicateInspector;
