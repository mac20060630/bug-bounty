import React from 'react';
import useAuth from '../hooks/useAuth';
import {
  Shield,
  Bug,
  Award,
  PlusCircle,
  Clock,
  CheckCircle2,
  FileText,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';

export const ResearcherDashboard = () => {
  const { user } = useAuth();

  const stats = [
    {
      label: 'Verified Reputation',
      value: `${user?.reputation || 0} PTS`,
      desc: 'Based on validated severity',
      icon: Award,
      color: 'text-amber-400',
      border: 'border-amber-500/30',
      bg: 'bg-amber-500/10',
    },
    {
      label: 'Submitted Reports',
      value: '0',
      desc: 'Total reports filed',
      icon: Bug,
      color: 'text-cyan-400',
      border: 'border-cyan-500/30',
      bg: 'bg-cyan-500/10',
    },
    {
      label: 'Pending Triage',
      value: '0',
      desc: 'Under security review',
      icon: Clock,
      color: 'text-purple-400',
      border: 'border-purple-500/30',
      bg: 'bg-purple-500/10',
    },
    {
      label: 'Accepted Findings',
      value: '0',
      desc: 'Rewarded disclosures',
      icon: CheckCircle2,
      color: 'text-emerald-400',
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-500/10',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Researcher Command Deck</h1>
            <Badge variant="researcher">Researcher</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Welcome back, <span className="text-white font-semibold">{user?.name}</span>. Track
            vulnerabilities and earn reputation for ethical disclosures.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            icon={PlusCircle}
            onClick={() =>
              alert(
                'Phase 1 complete! Vulnerability report submission workflow is arriving in Phase 2.'
              )
            }
          >
            Submit Vulnerability
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className={`glass-panel p-5 rounded-2xl border ${stat.border} transition-all hover:translate-y-[-2px]`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {stat.label}
                </span>
                <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-white font-mono">{stat.value}</div>
              <p className="text-[11px] text-slate-500 mt-1">{stat.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Main Submissions Shell */}
      <div className="glass-panel p-6 rounded-2xl border border-cyber-border/80 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white">Your Vulnerability Disclosures</h3>
            <p className="text-xs text-slate-400">
              Live tracking of submitted reports, severity scores, and status
            </p>
          </div>
          <span className="text-xs text-cyan-400 font-mono">0 Active</span>
        </div>

        {/* Empty State */}
        <div className="py-12 text-center max-w-sm mx-auto space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto">
            <FileText className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-bold text-white">No Vulnerabilities Reported Yet</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            You haven't submitted any vulnerability disclosures. When you find an issue in scope,
            submit it here for responsible triage and bounty evaluation.
          </p>
          <div className="pt-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-[11px] border border-slate-700">
              <Shield className="h-3 w-3 text-cyan-400" />
              Reporting workflow unlocks in Phase 2
            </span>
          </div>
        </div>
      </div>

      {/* Responsible Disclosure Quick Reference */}
      <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-bold text-slate-200">
            <Shield className="h-4 w-4 text-cyan-400" />
            <span>Responsible Disclosure Standard Policy</span>
          </div>
          <p className="text-slate-400 text-[11px] max-w-2xl">
            Never access customer data, perform denial-of-service, or alter production records. Give
            security teams at least 90 days before coordinated disclosure.
          </p>
        </div>
        <div className="flex items-center gap-2 text-cyan-400 font-semibold cursor-pointer hover:underline text-[11px]">
          <span>Security Guidelines</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </div>
      </div>
    </div>
  );
};

export default ResearcherDashboard;
