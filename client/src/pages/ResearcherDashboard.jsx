import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import * as statsService from '../services/statsService';
import {
  Shield,
  Bug,
  Award,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  ExternalLink,
  ArrowRight,
  DollarSign,
  TrendingUp,
  Activity,
} from 'lucide-react';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';

export const ResearcherDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadResearcherStats = async () => {
      try {
        const res = await statsService.getResearcherStats();
        if (res.success && res.data?.stats) {
          setStats(res.data.stats);
        }
      } catch (err) {
        console.error('Failed to load researcher stats:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadResearcherStats();
  }, []);

  const statCards = [
    {
      label: 'Verified Reputation',
      value: `${stats?.reputation ?? user?.reputation ?? 0} PTS`,
      desc: 'Earned from accepted findings',
      icon: Award,
      color: 'text-amber-400',
      border: 'border-amber-500/30',
      bg: 'bg-amber-500/10',
    },
    {
      label: 'Total Bounties Earned',
      value: `$${(stats?.totalRewards ?? 0).toLocaleString()}`,
      desc: 'Validated bounty payouts',
      icon: DollarSign,
      color: 'text-emerald-400',
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Accepted Findings',
      value: String(stats?.acceptedReports ?? 0),
      desc: `${stats?.totalReports ?? 0} total submissions filed`,
      icon: CheckCircle2,
      color: 'text-cyan-400',
      border: 'border-cyan-500/30',
      bg: 'bg-cyan-500/10',
    },
    {
      label: 'Pending Triage',
      value: String(stats?.pendingReports ?? 0),
      desc: `${stats?.rejectedReports ?? 0} rejected findings`,
      icon: Clock,
      color: 'text-purple-400',
      border: 'border-purple-500/30',
      bg: 'bg-purple-500/10',
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
            <h1 className="text-2xl font-bold text-white tracking-tight">Researcher Operations Deck</h1>
            <Badge variant="researcher">Verified Researcher</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Welcome back, <span className="text-white font-semibold">{user?.name}</span>. Track your
            submissions, monitor bounty payouts, and review your audit reputation activity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/leaderboard">
            <Button variant="accent" size="md" icon={Award}>
              Leaderboard
            </Button>
          </Link>
          <Link to="/reports/submit">
            <Button variant="primary" size="md" icon={PlusCircle}>
              Submit Finding
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => {
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

      {/* Main Submissions & Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Recent Submissions */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-cyber-border/80 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white">Recent Vulnerability Submissions</h3>
              <p className="text-xs text-slate-400">
                Live status tracking, severity ratings, and triage outcomes
              </p>
            </div>
            {stats?.recentReports?.length > 0 && (
              <Link to="/reports" className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1">
                <span>View All ({stats.totalReports})</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-cyan-400">
              <Spinner size="md" />
              <p className="text-xs font-mono text-slate-400 mt-2">Loading Submissions...</p>
            </div>
          ) : !stats?.recentReports || stats.recentReports.length === 0 ? (
            <div className="py-12 text-center max-w-sm mx-auto space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto">
                <FileText className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-bold text-white">No Vulnerabilities Reported Yet</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Explore active programs in scope and submit your research findings to earn rewards and reputation points.
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
                  {stats.recentReports.map((rep) => (
                    <tr key={rep._id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-3 font-semibold text-white truncate max-w-[200px]">
                        {rep.title}
                      </td>
                      <td className="py-3 px-3 text-slate-400 truncate max-w-[140px]">
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

        {/* Right Col: Recent Rewards & Reputation Audit Activity */}
        <div className="space-y-6">
          {/* Recent Rewards */}
          <div className="glass-panel p-5 rounded-2xl border border-cyber-border/80 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-emerald-400" />
                <span>Recent Bounties</span>
              </h4>
              <span className="text-xs font-mono font-bold text-emerald-400">
                ${(stats?.totalRewards ?? 0).toLocaleString()} Total
              </span>
            </div>

            {isLoading ? (
              <div className="py-4 text-center text-cyan-400">
                <Spinner size="sm" />
              </div>
            ) : !stats?.recentRewards || stats.recentRewards.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-3">No bounty payouts recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {stats.recentRewards.map((rw) => (
                  <div
                    key={rw._id}
                    className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-white truncate max-w-[130px] block">
                        {rw.programId?.companyName || 'Bounty'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(rw.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <span className="text-sm font-bold font-mono text-emerald-400">
                      +${rw.amount.toLocaleString()} {rw.currency}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reputation Activity Stream */}
          <div className="glass-panel p-5 rounded-2xl border border-cyber-border/80 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-cyan-400" />
                <span>Reputation Activity</span>
              </h4>
              <span className="text-xs font-mono text-cyan-400">
                {stats?.reputation ?? 0} PTS
              </span>
            </div>

            {isLoading ? (
              <div className="py-4 text-center text-cyan-400">
                <Spinner size="sm" />
              </div>
            ) : !stats?.reputationActivity || stats.reputationActivity.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-3">No reputation events recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {stats.reputationActivity.map((log) => (
                  <div
                    key={log._id}
                    className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-cyan-400">
                        +{log.points} PTS
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(log.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-tight">
                      {log.reason}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResearcherDashboard;
