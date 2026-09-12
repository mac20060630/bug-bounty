import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bug,
  Shield,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  Award,
  ExternalLink,
} from 'lucide-react';
import * as reportService from '../services/reportService';
import Spinner from '../components/common/Spinner';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';

export const MyReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMyReports = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await reportService.getReports();
        if (response.success && response.data?.reports) {
          setReports(response.data.reports);
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load your reports');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyReports();
  }, []);

  const getStatusBadge = (status) => {
    const map = {
      submitted: { variant: 'researcher', label: 'Submitted' },
      under_review: { variant: 'purple', label: 'Under Review' },
      triaged: { variant: 'warning', label: 'Triaged' },
      accepted: { variant: 'admin', label: 'Accepted' },
      reward_assigned: { variant: 'admin', label: 'Reward Assigned' },
      rejected: { variant: 'danger', label: 'Rejected' },
      resolved: { variant: 'admin', label: 'Resolved' },
    };
    const item = map[status] || { variant: 'neutral', label: status };
    return <Badge variant={item.variant}>{item.label}</Badge>;
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

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">My Vulnerability Disclosures</h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              {reports.length} Total
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Track status progression, CVSS severity reviews, and bounty awards for your reported findings.
          </p>
        </div>

        <Link to="/reports/submit">
          <Button variant="primary" size="sm" icon={PlusCircle}>
            Submit New Finding
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-cyan-400">
          <Spinner size="lg" />
          <p className="text-xs font-mono text-slate-400 mt-3">Loading Submissions...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center max-w-md mx-auto space-y-3">
          <Bug className="h-10 w-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Reports Submitted Yet</h3>
          <p className="text-xs text-slate-400">
            You haven't submitted any vulnerability disclosures. Explore active programs in scope and submit your research.
          </p>
          <div className="pt-3">
            <Link to="/programs">
              <Button variant="primary" size="sm" icon={ArrowRight}>
                Explore Active Programs
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-cyber-border/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Vulnerability Finding</th>
                  <th className="py-3.5 px-4 font-semibold">Program</th>
                  <th className="py-3.5 px-4 font-semibold">Severity</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold">Submitted</th>
                  <th className="py-3.5 px-4 font-semibold">Bounty Reward</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {reports.map((rep) => (
                  <tr key={rep._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-4 font-medium">
                      <Link
                        to={`/reports/${rep._id}`}
                        className="text-white hover:text-cyan-400 font-bold block truncate max-w-[220px]"
                        title={rep.title}
                      >
                        {rep.title}
                      </Link>
                      <span className="text-[10px] text-slate-500 font-mono block truncate max-w-[220px]">
                        {rep.affectedAsset}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <span className="text-slate-200 font-semibold block">
                        {rep.programId?.companyName || 'Program'}
                      </span>
                      <span className="text-[10px] text-slate-500 truncate block max-w-[150px]">
                        {rep.programId?.title}
                      </span>
                    </td>

                    <td className="py-4 px-4">{getSeverityBadge(rep.severity)}</td>

                    <td className="py-4 px-4">{getStatusBadge(rep.status)}</td>

                    <td className="py-4 px-4 font-mono text-slate-400">{formatDate(rep.createdAt)}</td>

                    <td className="py-4 px-4">
                      {rep.reward?.amount > 0 ? (
                        <span className="font-mono font-bold text-emerald-400">
                          ${rep.reward.amount} {rep.reward.currency}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px] italic">Pending Triage</span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-right">
                      <Link to={`/reports/${rep._id}`}>
                        <Button variant="ghost" size="sm" icon={ExternalLink}>
                          Inspect
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyReportsPage;
