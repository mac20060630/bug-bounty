import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import * as authService from '../services/authService';
import * as statsService from '../services/statsService';
import * as reportService from '../services/reportService';
import {
  ShieldAlert,
  Terminal,
  Building2,
  Activity,
  CheckCircle,
  AlertTriangle,
  Play,
  Lock,
  Cpu,
  PlusCircle,
  ArrowRight,
  ExternalLink,
  DollarSign,
  Award,
  Users,
  CheckCircle2,
  Sliders,
} from 'lucide-react';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Alert from '../components/common/Alert';
import Spinner from '../components/common/Spinner';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [adminCheckResult, setAdminCheckResult] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [checkError, setCheckError] = useState(null);

  const [stats, setStats] = useState(null);
  const [recentReports, setRecentReports] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statsRes, repRes] = await Promise.all([
          statsService.getAdminStats(),
          reportService.getReports({ limit: 5, sort: '-createdAt' }),
        ]);

        if (statsRes.success && statsRes.data?.stats) {
          setStats(statsRes.data.stats);
        }

        if (repRes.success && repRes.data?.reports) {
          setRecentReports(repRes.data.reports);
        }
      } catch (err) {
        console.error('Failed to load real admin metrics:', err);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchStats();
  }, []);

  const handleRunAdminCheck = async () => {
    setIsChecking(true);
    setCheckError(null);
    setAdminCheckResult(null);

    try {
      const data = await authService.checkAdminAccess();
      setAdminCheckResult(data);
    } catch (err) {
      setCheckError(
        err.response?.data?.message || err.message || 'Access denied. You do not have admin permissions.'
      );
    } finally {
      setIsChecking(false);
    }
  };

  const statCards = [
    {
      label: 'Configured Programs',
      value: String(stats?.totalPrograms ?? 0),
      desc: `${stats?.activePrograms ?? 0} active bounty scopes`,
      icon: Building2,
      color: 'text-cyan-400',
      border: 'border-cyan-500/30',
      bg: 'bg-cyan-500/10',
    },
    {
      label: 'Total Submissions',
      value: String(stats?.totalReports ?? 0),
      desc: `${stats?.pendingReviews ?? 0} pending initial triage`,
      icon: AlertTriangle,
      color: 'text-amber-400',
      border: 'border-amber-500/30',
      bg: 'bg-amber-500/10',
    },
    {
      label: 'Critical Vulnerabilities',
      value: String(stats?.criticalReports ?? 0),
      desc: 'Urgent remediation targets',
      icon: ShieldAlert,
      color: 'text-red-400',
      border: 'border-red-500/30',
      bg: 'bg-red-500/10',
    },
    {
      label: 'Total Bounty Distributed',
      value: `$${(stats?.totalRewards ?? 0).toLocaleString()}`,
      desc: `Paid out to verified researchers`,
      icon: DollarSign,
      color: 'text-emerald-400',
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-500/10',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Admin Operations Command</h1>
            <Badge variant="admin">System Administrator</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Logged in as <span className="text-white font-semibold">{user?.name}</span> ({user?.email})
            &bull; Real-time MongoDB metrics & platform telemetry
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/admin/reports">
            <Button variant="accent" size="sm" icon={Sliders}>
              Triage Reports Queue
            </Button>
          </Link>
          <Link to="/admin/programs">
            <Button variant="secondary" size="sm" icon={Building2}>
              Manage Programs
            </Button>
          </Link>
          <Link to="/leaderboard">
            <Button variant="ghost" size="sm" icon={Award}>
              Leaderboard
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

      {/* Triage & Resolution Statistics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">Pending Review</span>
            <span className="text-xl font-bold font-mono text-amber-400">
              {stats?.pendingReviews ?? 0}
            </span>
          </div>
          <AlertTriangle className="h-5 w-5 text-amber-500/50" />
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">Triaged Findings</span>
            <span className="text-xl font-bold font-mono text-purple-400">
              {stats?.triagedReports ?? 0}
            </span>
          </div>
          <Sliders className="h-5 w-5 text-purple-500/50" />
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">Accepted & Rewarded</span>
            <span className="text-xl font-bold font-mono text-cyan-400">
              {stats?.acceptedReports ?? 0}
            </span>
          </div>
          <Award className="h-5 w-5 text-cyan-500/50" />
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">Resolution Rate</span>
            <span className="text-xl font-bold font-mono text-emerald-400">
              {stats?.resolutionRate ?? 0}% ({stats?.resolvedReports ?? 0} closed)
            </span>
          </div>
          <CheckCircle2 className="h-5 w-5 text-emerald-500/50" />
        </div>
      </div>

      {/* Interactive Live Backend RBAC Authorization Tester */}
      <div className="glass-panel p-6 rounded-2xl border border-cyber-border/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Terminal className="h-5 w-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">Live Backend RBAC Authorization Tester</h3>
            </div>
            <p className="text-xs text-slate-400">
              Test server-side role enforcement by sending an authenticated request to{' '}
              <code className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-400 font-mono text-[11px]">
                GET /api/auth/admin-check
              </code>
            </p>
          </div>

          <Button
            variant="accent"
            size="sm"
            onClick={handleRunAdminCheck}
            isLoading={isChecking}
            icon={Play}
          >
            Execute Authorization Check
          </Button>
        </div>

        {checkError && (
          <Alert
            type="error"
            title="Backend 403 Forbidden Response"
            message={checkError}
            onClose={() => setCheckError(null)}
          />
        )}

        {adminCheckResult && (
          <div className="p-4 rounded-xl bg-slate-900/90 border border-emerald-500/40 text-xs font-mono space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <CheckCircle className="h-4 w-4" />
              <span>HTTP 200 OK: Backend Confirmed Admin Authorization</span>
            </div>
            <pre className="p-3 rounded-lg bg-black/50 text-slate-300 overflow-x-auto text-[11px]">
              {JSON.stringify(adminCheckResult, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Triage Queue & Platform Governance Shell */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-cyber-border/80 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-400" />
              <span>Incoming Triage Submissions</span>
            </h4>
            <Link to="/admin/reports" className="text-xs text-cyan-400 hover:underline font-mono">
              View All Queue &rarr;
            </Link>
          </div>

          {isLoadingData ? (
            <div className="py-6 text-center text-cyan-400">
              <Spinner size="sm" />
            </div>
          ) : recentReports.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-4">No reports currently in the triage queue.</p>
          ) : (
            <div className="space-y-2">
              {recentReports.map((r) => (
                <div
                  key={r._id}
                  className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-cyan-500/30 flex items-center justify-between text-xs transition-colors"
                >
                  <div className="overflow-hidden pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white truncate max-w-[180px]">{r.title}</span>
                      <Badge variant={r.severity === 'critical' ? 'danger' : 'warning'} size="xs">
                        {r.severity}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-mono truncate max-w-[220px]">
                      {r.programId?.companyName || 'Program'} &bull; {r.affectedAsset}
                    </p>
                  </div>
                  <Link to={`/reports/${r._id}`}>
                    <Button variant="ghost" size="sm">
                      Triage
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-cyber-border/80 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="h-4 w-4 text-cyan-400" />
              <span>Platform Security Health & Services</span>
            </h4>
            <span className="text-xs text-emerald-400 font-mono">ALL SYSTEMS OPERATIONAL</span>
          </div>
          <ul className="text-xs space-y-2 text-slate-300">
            <li className="flex items-center justify-between p-2 rounded-lg bg-slate-900/30">
              <span>Reputation Engine</span>
              <span className="text-cyan-400 font-mono">AUTOMATED (+100/50/25/10 PTS)</span>
            </li>
            <li className="flex items-center justify-between p-2 rounded-lg bg-slate-900/30">
              <span>Vulnerability State Machine</span>
              <span className="text-emerald-400 font-mono">ENFORCED (Strict 7-step)</span>
            </li>
            <li className="flex items-center justify-between p-2 rounded-lg bg-slate-900/30">
              <span>Internal Admin Notes</span>
              <span className="text-amber-400 font-mono">PRIVACY SECURED</span>
            </li>
            <li className="flex items-center justify-between p-2 rounded-lg bg-slate-900/30">
              <span>Researcher Community</span>
              <span className="text-purple-400 font-mono">{stats?.totalResearchers ?? 0} ACTIVE</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
