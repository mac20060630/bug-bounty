import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  Bug,
  Building2,
  Calendar,
  Clock,
  ArrowLeft,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  Lock,
  AlertTriangle,
  Award,
} from 'lucide-react';
import * as reportService from '../services/reportService';
import useAuth from '../hooks/useAuth';
import Spinner from '../components/common/Spinner';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Alert from '../components/common/Alert';
import StatusTimeline from '../components/common/StatusTimeline';

export const ReportDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await reportService.getReportById(id);
        if (response.success && response.data?.report) {
          setReport(response.data.report);
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load report');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReport();
  }, [id]);

  if (isLoading) {
    return (
      <div className="py-24 text-center text-cyan-400">
        <Spinner size="lg" />
        <p className="text-xs font-mono text-slate-400 mt-3">Loading Vulnerability Dossier...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <Alert
          type="error"
          title="Access Restricted or Report Not Found"
          message={error}
        />
        <Link to="/reports">
          <Button variant="secondary" size="sm" icon={ArrowLeft}>
            Back to My Reports
          </Button>
        </Link>
      </div>
    );
  }

  const getSeverityBadge = (sev) => {
    const map = {
      low: 'researcher',
      medium: 'warning',
      high: 'danger',
      critical: 'danger',
    };
    return (
      <Badge variant={map[sev] || 'neutral'} size="md">
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back Link */}
      <Link
        to={isAdmin ? '/admin/dashboard' : '/reports'}
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>{isAdmin ? 'Back to Admin Console' : 'Back to My Reports'}</span>
      </Link>

      {/* Header Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-cyber-border/80 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 pb-6 border-b border-slate-800">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-xs text-slate-500">REPORT #{report._id}</span>
              {getSeverityBadge(report.severity)}
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                CVSS {report.riskScore?.toFixed(1) || '5.0'}
              </span>
              <span className="text-xs font-semibold text-cyan-400 flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                {report.programId?.companyName}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {report.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
              <span>
                Target Asset: <code className="text-cyan-400 font-mono">{report.affectedAsset}</code>
              </span>
              <span>&bull;</span>
              <span>Category: <span className="text-slate-200 capitalize">{report.category?.replace(/_/g, ' ')}</span></span>
              <span>&bull;</span>
              <span>Submitted: {formatDate(report.createdAt)}</span>
            </div>
          </div>

          {/* Reward Snippet */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700/80 shrink-0 text-left lg:text-right space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Bounty Reward
            </span>
            <div className="text-xl font-bold font-mono text-emerald-400">
              {report.reward?.amount > 0
                ? `$${report.reward.amount} ${report.reward.currency}`
                : 'Pending Validation'}
            </div>
            <span className="text-[10px] text-slate-500 block">
              Status: <span className="capitalize">{report.reward?.status || 'pending'}</span>
            </span>
          </div>
        </div>

        {/* Status Lifecycle Progression */}
        <div className="py-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Current Lifecycle Status:
          </p>
          <StatusTimeline currentStatus={report.status} statusHistory={report.statusHistory} />
        </div>
      </div>

      {/* Main Technical Finding Dossier */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-cyber-border/80 space-y-6">
        <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
          <Bug className="h-4 w-4 text-cyan-400" />
          <span>Vulnerability Analysis</span>
        </h2>

        {/* Summary Description */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Description & Impact Summary
          </h3>
          <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line bg-slate-900/40 p-4 rounded-xl border border-slate-800">
            {report.description}
          </p>
        </div>

        {/* Steps to Reproduce */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Technical Steps to Reproduce
          </h3>
          <div className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap border border-slate-800 overflow-x-auto">
            {report.reproductionSteps}
          </div>
        </div>

        {/* Business Impact */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Security & Business Impact
          </h3>
          <p className="text-sm text-slate-200 leading-relaxed bg-slate-900/40 p-4 rounded-xl border border-slate-800">
            {report.impact}
          </p>
        </div>

        {/* Remediation */}
        {report.suggestedRemediation && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Suggested Remediation
            </h3>
            <p className="text-sm text-slate-200 leading-relaxed bg-slate-900/40 p-4 rounded-xl border border-slate-800">
              {report.suggestedRemediation}
            </p>
          </div>
        )}

        {/* Evidence Gallery */}
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <ImageIcon className="h-4 w-4 text-cyan-400" />
            <span>Attached Proof of Concept Evidence ({report.evidence?.length || 0})</span>
          </h3>

          {report.evidence?.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No external files attached.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {report.evidence.map((file, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium truncate max-w-[170px]" title={file.fileName}>
                      {file.fileName}
                    </span>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 p-1"
                      title="Open file"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>

                  {file.fileType?.startsWith('image') && (
                    <a href={file.url} target="_blank" rel="noopener noreferrer">
                      <img
                        src={file.url}
                        alt={file.fileName}
                        className="w-full h-32 object-cover rounded-lg border border-slate-800 hover:opacity-90 transition-opacity"
                      />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status History & Audit Log */}
        {report.statusHistory && report.statusHistory.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-cyan-400" />
              <span>Audit & Progression Log</span>
            </h3>
            <div className="space-y-2">
              {report.statusHistory.map((history, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between p-3 rounded-lg bg-slate-900/40 border border-slate-800 text-xs"
                >
                  <div>
                    <span className="font-bold text-cyan-400 uppercase">{history.toStatus}</span>
                    <p className="text-slate-300 mt-0.5">{history.note}</p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">{formatDate(history.timestamp)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportDetailsPage;
