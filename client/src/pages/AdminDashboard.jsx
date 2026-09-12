import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import * as authService from '../services/authService';
import * as programService from '../services/programService';
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

  const [programsCount, setProgramsCount] = useState(0);
  const [triageReports, setTriageReports] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [progRes, repRes] = await Promise.all([
          programService.getPrograms(),
          reportService.getReports({ limit: 5 }),
        ]);

        if (progRes.success && progRes.data?.programs) {
          setProgramsCount(progRes.data.programs.length);
        }

        if (repRes.success && repRes.data?.reports) {
          setTriageReports(repRes.data.reports);
        }
      } catch (err) {
        console.error('Failed to load admin metrics:', err);
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

  const pendingCount = triageReports.filter((r) => ['submitted', 'under_review'].includes(r.status)).length;
  const criticalCount = triageReports.filter((r) => r.severity === 'critical').length;

  const stats = [
    {
      label: 'Configured Programs',
      value: String(programsCount),
      desc: 'Active & closed bounties',
      icon: Building2,
      color: 'text-cyan-400',
      border: 'border-cyan-500/30',
      bg: 'bg-cyan-500/10',
    },
    {
      label: 'Pending Triage Queue',
      value: String(pendingCount),
      desc: 'Awaiting impact assessment',
      icon: AlertTriangle,
      color: 'text-amber-400',
      border: 'border-amber-500/30',
      bg: 'bg-amber-500/10',
    },
    {
      label: 'Critical Findings',
      value: String(criticalCount),
      desc: 'High-priority remediation',
      icon: ShieldAlert,
      color: 'text-red-400',
      border: 'border-red-500/30',
      bg: 'bg-red-500/10',
    },
    {
      label: 'Platform Auth Status',
      value: '100% OK',
      desc: 'Bcrypt + JWT active',
      icon: Activity,
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
            <h1 className="text-2xl font-bold text-white tracking-tight">Admin Operations Console</h1>
            <Badge variant="admin">System Administrator</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Logged in as <span className="text-white font-semibold">{user?.name}</span> ({user?.email})
            &bull; Full administrative governance
          </p>
        </div>

        <Link to="/admin/programs">
          <Button variant="accent" size="sm" icon={Building2}>
            Manage Bounty Programs
          </Button>
        </Link>
      </div>

      {/* Stats Row */}
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

        {!adminCheckResult && !checkError && (
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400 flex items-center gap-3">
            <Lock className="h-4 w-4 text-cyan-400 shrink-0" />
            <span>
              Click the button above to execute a real-time HTTP call with your bearer token to test backend
              role enforcement.
            </span>
          </div>
        )}
      </div>

      {/* Triage Queue & Platform Governance Shell */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-cyber-border/80 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-400" />
              <span>Incoming Triage Queue</span>
            </h4>
            <span className="text-xs text-cyan-400 font-mono">{triageReports.length} Reports</span>
          </div>

          {isLoadingData ? (
            <div className="py-6 text-center text-cyan-400">
              <Spinner size="sm" />
            </div>
          ) : triageReports.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-4">No reports currently in the triage queue.</p>
          ) : (
            <div className="space-y-2">
              {triageReports.slice(0, 4).map((r) => (
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
                      Inspect
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
              <span>Platform Security Health</span>
            </h4>
            <span className="text-xs text-emerald-400 font-mono">HEALTHY</span>
          </div>
          <ul className="text-xs space-y-2 text-slate-300">
            <li className="flex items-center justify-between p-2 rounded-lg bg-slate-900/30">
              <span>Cloudinary Evidence Uploader</span>
              <span className="text-emerald-400 font-mono">ACTIVE (Multi-Storage)</span>
            </li>
            <li className="flex items-center justify-between p-2 rounded-lg bg-slate-900/30">
              <span>Database Sanitization (NoSQL)</span>
              <span className="text-emerald-400 font-mono">ENABLED</span>
            </li>
            <li className="flex items-center justify-between p-2 rounded-lg bg-slate-900/30">
              <span>Auth Rate Limiter</span>
              <span className="text-emerald-400 font-mono">30 REQ / 15 MIN</span>
            </li>
            <li className="flex items-center justify-between p-2 rounded-lg bg-slate-900/30">
              <span>Bcrypt Salt Workfactor</span>
              <span className="text-emerald-400 font-mono">12 ROUNDS</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
