import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Search,
  Filter,
  SlidersHorizontal,
  ArrowUpDown,
  Building2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Bug,
  Award,
  AlertTriangle,
  CheckCircle,
  Eye,
} from 'lucide-react';
import * as reportService from '../services/reportService';
import * as programService from '../services/programService';
import Spinner from '../components/common/Spinner';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';

export const AdminReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1, limit: 10 });
  const [isLoading, setIsLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [severity, setSeverity] = useState('');
  const [programId, setProgramId] = useState('');
  const [sortBy, setSortBy] = useState('-createdAt');
  const [currentPage, setCurrentPage] = useState(1);

  // Load programs for dropdown
  useEffect(() => {
    const loadPrograms = async () => {
      try {
        const res = await programService.getPrograms({ limit: 100 });
        if (res.success && res.data?.programs) {
          setPrograms(res.data.programs);
        }
      } catch (err) {
        console.error('Failed to load programs for filter:', err);
      }
    };
    loadPrograms();
  }, []);

  // Fetch reports when filters or page changes
  useEffect(() => {
    const fetchReports = async () => {
      setIsLoading(true);
      try {
        const params = {
          page: currentPage,
          limit: 10,
          sort: sortBy,
        };
        if (search.trim()) params.search = search.trim();
        if (status) params.status = status;
        if (severity) params.severity = severity;
        if (programId) params.programId = programId;

        const res = await reportService.getReports(params);
        if (res.success && res.data?.reports) {
          setReports(res.data.reports);
          setPagination(res.data.pagination || { total: res.data.reports.length, page: 1, pages: 1 });
        }
      } catch (err) {
        console.error('Failed to fetch admin reports:', err);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchReports();
    }, 200);

    return () => clearTimeout(timer);
  }, [search, status, severity, programId, sortBy, currentPage]);

  const handleResetFilters = () => {
    setSearch('');
    setStatus('');
    setSeverity('');
    setProgramId('');
    setSortBy('-createdAt');
    setCurrentPage(1);
  };

  const getStatusBadge = (st) => {
    const map = {
      submitted: 'researcher',
      under_review: 'purple',
      triaged: 'warning',
      accepted: 'admin',
      reward_assigned: 'admin',
      rejected: 'danger',
      resolved: 'admin',
    };
    return (
      <Badge variant={map[st] || 'neutral'} size="xs">
        {st?.replace(/_/g, ' ')}
      </Badge>
    );
  };

  const getSeverityBadge = (sev) => {
    const map = {
      low: 'researcher',
      medium: 'warning',
      high: 'danger',
      critical: 'danger',
    };
    return (
      <Badge variant={map[sev] || 'neutral'} size="xs">
        {sev}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Vulnerability Triage & Reports Console
            </h1>
            <Badge variant="admin">Admin Operations</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Global repository of security submissions across all bounty programs &bull; Centralized triage, severity adjudication, and reward assignment
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/admin/programs">
            <Button variant="secondary" size="sm" icon={Building2}>
              Manage Programs
            </Button>
          </Link>
          <Link to="/leaderboard">
            <Button variant="accent" size="sm" icon={Award}>
              View Leaderboard
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel p-5 rounded-2xl border border-cyber-border/80 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search title, description, asset..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="triaged">Triaged</option>
              <option value="accepted">Accepted</option>
              <option value="reward_assigned">Reward Assigned</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div>
            <select
              value={severity}
              onChange={(e) => {
                setSeverity(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Program Filter */}
          <div>
            <select
              value={programId}
              onChange={(e) => {
                setProgramId(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 truncate"
            >
              <option value="">All Programs</option>
              {programs.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.companyName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Secondary controls: Sort + Reset */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 flex items-center gap-1 font-mono text-[11px]">
              <ArrowUpDown className="h-3 w-3 text-cyan-400" />
              SORT:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-lg bg-slate-900 border border-slate-800 text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="-createdAt">Newest Submissions First</option>
              <option value="createdAt">Oldest Submissions First</option>
              <option value="-riskScore">Highest CVSS Risk First</option>
              <option value="riskScore">Lowest CVSS Risk First</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-xs font-mono">
              Total Matches: <strong className="text-white">{pagination.total || 0}</strong>
            </span>
            {(search || status || severity || programId || sortBy !== '-createdAt') && (
              <button
                onClick={handleResetFilters}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium hover:underline"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="glass-panel rounded-2xl border border-cyber-border/80 overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-cyan-400">
            <Spinner size="lg" />
            <p className="text-xs font-mono text-slate-400 mt-2">Loading Report Queue...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto">
              <Bug className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-white">No Reports Match Criteria</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Try adjusting your search query, status, severity, or program filters to locate submissions.
            </p>
            <Button variant="ghost" size="sm" onClick={handleResetFilters}>
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px] bg-slate-900/40">
                <tr>
                  <th className="py-3 px-4">Title & Target Asset</th>
                  <th className="py-3 px-4">Program</th>
                  <th className="py-3 px-4">Researcher</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Bounty</th>
                  <th className="py-3 px-4 text-right">Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {reports.map((rep) => (
                  <tr key={rep._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="max-w-[240px]">
                        <Link
                          to={`/reports/${rep._id}`}
                          className="font-bold text-white hover:text-cyan-400 transition-colors truncate block"
                          title={rep.title}
                        >
                          {rep.title}
                        </Link>
                        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5 truncate">
                          <span>Asset:</span>
                          <code className="text-cyan-300 font-mono text-[10px] bg-slate-900 px-1 rounded">
                            {rep.affectedAsset}
                          </code>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-200 truncate max-w-[150px]">
                      {rep.programId?.companyName || '—'}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="truncate max-w-[130px]">
                        <span className="font-semibold text-slate-200 block">
                          {rep.researcherId?.name || 'Researcher'}
                        </span>
                        <span className="text-[10px] font-mono text-cyan-400">
                          {rep.researcherId?.reputation ?? 0} REP
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        {getSeverityBadge(rep.severity)}
                        <span className="text-[10px] font-mono text-slate-400">
                          {rep.riskScore?.toFixed(1) || '5.0'}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">{getStatusBadge(rep.status)}</td>

                    <td className="py-3.5 px-4 text-right font-mono">
                      {rep.reward?.amount > 0 ? (
                        <span className="font-bold text-emerald-400">
                          ${rep.reward.amount.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {new Date(rep.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link to={`/reports/${rep._id}`}>
                        <Button variant="accent" size="xs" icon={Eye}>
                          Triage
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.pages > 1 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 bg-slate-900/30">
            <span>
              Page <strong className="text-white">{pagination.page}</strong> of{' '}
              <strong className="text-white">{pagination.pages}</strong>
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
                aria-label="Previous Page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={pagination.page >= pagination.pages}
                onClick={() => setCurrentPage((p) => Math.min(pagination.pages, p + 1))}
                className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
                aria-label="Next Page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReportsPage;
