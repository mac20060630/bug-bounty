import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import useAuth from '../hooks/useAuth';
import * as authService from '../services/authService';
import * as statsService from '../services/statsService';
import * as analyticsService from '../services/analyticsService';
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
  ArrowRight,
  DollarSign,
  Award,
  CheckCircle2,
  Sliders,
  TrendingUp,
  Clock,
  PieChart as PieIcon,
  BarChart3,
} from 'lucide-react';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Alert from '../components/common/Alert';
import Spinner from '../components/common/Spinner';

const SEVERITY_COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#06b6d4',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs shadow-2xl space-y-1 font-mono">
        <p className="text-slate-400 font-semibold">{label}</p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-300 capitalize">{entry.name}:</span>
            <span className="font-bold text-white">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [adminCheckResult, setAdminCheckResult] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [checkError, setCheckError] = useState(null);

  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [recentReports, setRecentReports] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, analyticsRes, repRes] = await Promise.all([
          statsService.getAdminStats(),
          analyticsService.getAdminAnalytics(),
          reportService.getReports({ limit: 5, sort: '-createdAt' }),
        ]);

        if (statsRes.success && statsRes.data?.stats) {
          setStats(statsRes.data.stats);
        }
        if (analyticsRes.success && analyticsRes.data?.analytics) {
          setAnalytics(analyticsRes.data.analytics);
        }
        if (repRes.success && repRes.data?.reports) {
          setRecentReports(repRes.data.reports);
        }
      } catch (err) {
        console.error('Failed to load admin analytics & telemetry:', err);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchDashboardData();
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
      pulse: (stats?.criticalReports ?? 0) > 0,
    },
    {
      label: 'Total Bounty Distributed',
      value: `$${(stats?.totalRewards ?? 0).toLocaleString()}`,
      desc: 'Paid out to verified researchers',
      icon: DollarSign,
      color: 'text-emerald-400',
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-500/10',
    },
  ];

  // Prepare chart data
  const reportsOverTimeData = analytics?.reportsOverTime?.length
    ? analytics.reportsOverTime
    : [
        { date: 'Initial', count: 0, criticalCount: 0, acceptedCount: 0 },
      ];

  const severityPieData = analytics?.severityDist?.length
    ? analytics.severityDist.map((item) => ({
        name: item.severity,
        value: item.count,
        color: SEVERITY_COLORS[item.severity] || '#94a3b8',
      }))
    : [
        { name: 'Low', value: 1, color: '#06b6d4' },
        { name: 'Medium', value: 1, color: '#eab308' },
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
            &bull; Live MongoDB aggregations & Socket.IO real-time telemetry
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

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className={`glass-panel p-5 rounded-2xl border ${stat.border} transition-all hover:translate-y-[-2px] relative overflow-hidden`}
            >
              {stat.pulse && (
                <div className="absolute top-2 right-2 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                </div>
              )}
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

      {/* Analytics Charts Grid (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reports & Submissions Velocity Over Time (2 cols) */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-cyber-border/80 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">
                Vulnerability Submissions Velocity & Trends
              </h3>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-2 py-0.5 rounded">
              REAL DATABASE TELEMETRY
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            {isLoadingData ? (
              <div className="h-full flex items-center justify-center text-cyan-400">
                <Spinner size="md" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={reportsOverTimeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="totalColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="critColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="Total Submissions"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#totalColor)"
                  />
                  <Area
                    type="monotone"
                    dataKey="criticalCount"
                    name="Critical Findings"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#critColor)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Severity Distribution Donut Chart (1 col) */}
        <div className="glass-panel p-6 rounded-2xl border border-cyber-border/80 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Severity Breakdown</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">CVSS v3.1</span>
          </div>

          <div className="h-52 w-full flex items-center justify-center">
            {isLoadingData ? (
              <Spinner size="md" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {severityPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-800">
            {severityPieData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5 font-mono">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-300 capitalize">{item.name}:</span>
                <span className="font-bold text-white ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Resolution Statistics & Program Performance Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resolution Statistics */}
        <div className="glass-panel p-6 rounded-2xl border border-cyber-border/80 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-400" />
              <h4 className="text-sm font-bold text-white">Resolution & Remediation Telemetry</h4>
            </div>
            <Badge variant="admin" size="xs">
              {stats?.resolutionRate ?? 0}% Remediation
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-mono uppercase">Mean Resolution Time</span>
              <span className="text-lg font-bold font-mono text-cyan-400">
                {analytics?.resolution?.avgResolutionHours ?? 0} hrs
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-mono uppercase">Total Resolved</span>
              <span className="text-lg font-bold font-mono text-emerald-400">
                {stats?.resolvedReports ?? 0}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-mono uppercase">Pending Triage</span>
              <span className="text-lg font-bold font-mono text-amber-400">
                {stats?.pendingReviews ?? 0}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Mean resolution time is dynamically derived from report creation to resolution lifecycle completion across all programs.
          </p>
        </div>

        {/* Top Programs Performance */}
        <div className="glass-panel p-6 rounded-2xl border border-cyber-border/80 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-purple-400" />
              <h4 className="text-sm font-bold text-white">Top Active Programs Scope</h4>
            </div>
            <Link to="/admin/programs" className="text-xs text-cyan-400 hover:underline font-mono">
              Manage &rarr;
            </Link>
          </div>

          {analytics?.topPrograms?.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-4">No program submission telemetry yet.</p>
          ) : (
            <div className="space-y-2">
              {analytics?.topPrograms?.map((prog, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-white">{prog.companyName}</span>
                    <span className="text-[10px] text-slate-400 block font-mono truncate max-w-[200px]">
                      {prog.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-cyan-400">
                      <strong>{prog.reportCount}</strong> reports
                    </span>
                    {prog.criticalCount > 0 && (
                      <Badge variant="danger" size="xs">
                        {prog.criticalCount} crit
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
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

      {/* Recent Submissions Triage Quick Access */}
      <div className="glass-panel p-6 rounded-2xl border border-cyber-border/80 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-400" />
            <h4 className="text-sm font-bold text-white">Incoming Submissions Queue</h4>
          </div>
          <Link to="/admin/reports" className="text-xs text-cyan-400 hover:underline font-mono">
            Full Triage Console &rarr;
          </Link>
        </div>

        {recentReports.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-4">No reports currently in the queue.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
    </div>
  );
};

export default AdminDashboard;
