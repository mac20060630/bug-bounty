import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, XCircle, Award, Check } from 'lucide-react';

export const StatusTimeline = ({ currentStatus = 'submitted', statusHistory = [] }) => {
  const steps = [
    { key: 'submitted', label: 'Submitted', desc: 'Received & Queued' },
    { key: 'under_review', label: 'Under Review', desc: 'Security Triage' },
    { key: 'triaged', label: 'Triaged', desc: 'Impact Assessed' },
    { key: 'accepted', label: 'Accepted', desc: 'Validated & Bounty Queued' },
    { key: 'resolved', label: 'Resolved', desc: 'Patched & Closed' },
  ];

  const getStepIndex = (status) => {
    switch (status) {
      case 'submitted':
        return 0;
      case 'under_review':
        return 1;
      case 'triaged':
        return 2;
      case 'accepted':
      case 'reward_assigned':
        return 3;
      case 'resolved':
        return 4;
      case 'rejected':
        return -1; // Special rejected state
      default:
        return 0;
    }
  };

  const currentIndex = getStepIndex(currentStatus);

  if (currentStatus === 'rejected') {
    return (
      <div className="p-4 rounded-xl bg-red-950/20 border border-red-900/40 text-xs text-red-300 flex items-center gap-3">
        <XCircle className="h-5 w-5 text-red-400 shrink-0" />
        <div>
          <p className="font-bold text-red-200">Vulnerability Report Rejected</p>
          <p className="text-[11px] text-red-400/90 mt-0.5">
            This finding was reviewed and closed as out of scope, informative, or not reproducible.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between relative">
        {/* Background Connecting Line */}
        <div className="absolute top-4 left-0 w-full h-0.5 bg-slate-800 -z-0" />

        {steps.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const isUpcoming = idx > currentIndex;

          return (
            <div key={step.key} className="flex flex-col items-center text-center relative z-10 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isCompleted
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30'
                    : isCurrent
                    ? 'bg-cyan-500 text-slate-950 ring-4 ring-cyan-500/20 shadow-lg shadow-cyan-500/30 animate-pulse'
                    : 'bg-slate-900 border border-slate-700 text-slate-500'
                }`}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4 stroke-[3]" />
                ) : isCurrent ? (
                  <Clock className="h-4 w-4 stroke-[2.5]" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>

              <p
                className={`text-xs font-semibold mt-2.5 ${
                  isCurrent
                    ? 'text-cyan-400'
                    : isCompleted
                    ? 'text-emerald-400'
                    : 'text-slate-500'
                }`}
              >
                {step.label}
              </p>
              <p className="text-[10px] text-slate-500 hidden sm:block mt-0.5">{step.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StatusTimeline;
