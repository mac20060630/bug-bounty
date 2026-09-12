import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import * as reportService from '../services/reportService';
import {
  Shield,
  Bug,
  Award,
  PlusCircle,
  Clock,
  CheckCircle2,
  FileText,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';

export const ResearcherDashboard = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadReports = async () => {
      try {
        const res = await reportService.getReports({ limit: 5 });
        if (res.success && res.data?.reports) {
          setReports(res.data.reports);
        }
      } catch (err) {
        console.error('Failed to load researcher reports:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadReports();
  }, []);

  const totalReports = reports.length;
  const pendingTriage = reports.filter((r) => ['submitted', 'under_review'].includes(r.status)).length;
  const acceptedReports = reports.filter((r) => ['accepted', 'reward_assigned', 'resolved'].includes(r.status)).length;

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
      value: String(totalReports),
      desc: 'Total findings filed',
      icon: Bug,
      color: 'text-cyan-400',
      border: 'border-cyan-500/30',
      bg: 'bg-cyan-500/10',
    },
    {
      label: 'Pending Review',
      value: String(pendingTriage),
      desc: 'Under security triage',
      icon: Clock,
      color: 'text-purple-400',
      border: 'border-purple-500/30',
      bg: 'bg-purple-500/10',
    },
    {
      label: 'Accepted Findings',
      value: String(acceptedReports),
      desc: 'Validated disclosures',
      icon: CheckCircle2,
      color: 'text-emerald-400',
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-500/10',
    },
  ];

  const getStatusBadge = (status) => {
    const map = {
      submitted: 'researcher',
      under_review: 'purple',
      triaged: 'warning',
      accepted: 'admin',
      reward_assigned: 'admin',
      rejected: 'danger',
      resolved: 'admin',
    };
    return <Badge variant={map[status] || 'neutral'} size="xs">{status?.replace(/_/g, ' ')}</Badge>;
  };

  const getSeverityBadge = (sev) => {
    const map = { low: 'researcher', medium: 'warning', high: 'danger', critical: 'danger' };
    return <Badge variant={map[sev] || 'neutral'} size="xs">{sev}</Badge>;
  };

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
            vulnerabilities, view active bounties, and earn verified reputation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/programs">
            <Button variant="secondary" size="md">
              Browse Programs
            </Button>
          </Link>
          <Link to="/reports/submit">
            <Button variant="primary" size="md" icon={PlusCircle}>
              Submit Vulnerability
            </Button>
          </Link>
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
            <h3 className="text-base font-bold text-white">Recent Vulnerability Disclosures</h3>
            <p className="text-xs text-slate-400">
              Live tracking of submitted reports, severity scores, and status
            </p>
          </div>
          {reports.length > 0 && (
            <Link to="/reports" className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1">
              <span>View All Reports</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {/* Reports Content */}
        {isLoading ? (
          <div className="py-12 text-center text-cyan-400">
            <Spinner size="md" />
            <p className="text-xs font-mono text-slate-400 mt-2">Loading Submissions...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="py-12 text-center max-w-sm mx-auto space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto">
              <FileText className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-white">No Vulnerabilities Reported Yet</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              You haven't submitted any vulnerability disclosures. Explore active programs in scope and submit your research findings.
            </p>
            <div className="pt-2">
              <Link to="/programs">
                <Button variant="primary" size="sm" icon={ArrowRight}>
                  Explore Bounty Programs
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3">Title</th>
                  <th className="py-3 px-3">Program</th>
                  <th className="py-3 px-3">Severity</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {reports.slice(0, 5).map((rep) => (
                  <tr key={rep._id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-3 font-semibold text-white truncate max-w-[200px]">
                      {rep.title}
                    </td>
                    <td className="py-3 px-3 text-slate-400 truncate max-w-[150px]">
                      {rep.programId?.companyName}
                    </td>
                    <td className="py-3 px-3">{getSeverityBadge(rep.severity)}</td>
                    <td className="py-3 px-3">{getStatusBadge(rep.status)}</td>
                    <td className="py-3 px-3 text-right">
                      <Link to={`/reports/${rep._id}`}>
                        <Button variant="ghost" size="sm">
                          Inspect
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
        <Link to="/programs" className="flex items-center gap-1.5 text-cyan-400 font-semibold hover:underline text-[11px]">
          <span>View Scope Targets</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
};

export default ResearcherDashboard;
