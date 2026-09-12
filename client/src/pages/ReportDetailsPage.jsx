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
  User,
  CheckCircle2,
  XCircle,
  MessageSquare,
  DollarSign,
  Send,
  Eye,
  Sliders,
  ChevronRight,
} from 'lucide-react';
import * as reportService from '../services/reportService';
import * as rewardService from '../services/rewardService';
import useAuth from '../hooks/useAuth';
import Spinner from '../components/common/Spinner';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Alert from '../components/common/Alert';
import StatusTimeline from '../components/common/StatusTimeline';
import RiskScoreInspector from '../components/common/RiskScoreInspector';
import DuplicateInspector from '../components/common/DuplicateInspector';

export const ReportDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [report, setReport] = useState(null);
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Workflow action states
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [statusReason, setStatusReason] = useState('');

  // Severity state
  const [selectedSeverity, setSelectedSeverity] = useState('');
  const [severityReason, setSeverityReason] = useState('');
  const [isUpdatingSeverity, setIsUpdatingSeverity] = useState(false);

  // Reward modal state
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [rewardAmount, setRewardAmount] = useState('');
  const [rewardCurrency, setRewardCurrency] = useState('USD');
  const [isAssigningReward, setIsAssigningReward] = useState(false);

  // Comments state
  const [newComment, setNewComment] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [isPostingComment, setIsPostingComment] = useState(false);

  const fetchReportData = async () => {
    try {
      const [repRes, comRes] = await Promise.all([
        reportService.getReportById(id),
        reportService.getReportComments(id),
      ]);

      if (repRes.success && repRes.data?.report) {
        setReport(repRes.data.report);
        setSelectedSeverity(repRes.data.report.severity);
      }
      if (comRes.success && comRes.data?.comments) {
        setComments(comRes.data.comments);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load report dossier');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [id]);

  // Handle Status Transition
  const handleTransition = async (nextStatus) => {
    setIsSubmittingAction(true);
    setActionSuccess(null);
    setError(null);

    try {
      const res = await reportService.updateReportStatus(id, {
        status: nextStatus,
        reason: statusReason || `Status transitioned to ${nextStatus}`,
      });

      if (res.success) {
        setActionSuccess(`Report successfully transitioned to "${nextStatus}".`);
        setStatusReason('');
        await fetchReportData();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to transition report status');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Handle Severity Update
  const handleUpdateSeverity = async (e) => {
    e.preventDefault();
    if (!selectedSeverity) return;
    setIsUpdatingSeverity(true);
    setActionSuccess(null);
    setError(null);

    try {
      const res = await reportService.updateReportSeverity(id, {
        severity: selectedSeverity,
        reason: severityReason || `Severity updated to ${selectedSeverity}`,
      });

      if (res.success) {
        setActionSuccess(`Severity updated to ${selectedSeverity.toUpperCase()}.`);
        setSeverityReason('');
        await fetchReportData();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update severity');
    } finally {
      setIsUpdatingSeverity(false);
    }
  };

  // Handle Assign Reward
  const handleAssignReward = async (e) => {
    e.preventDefault();
    const amount = Number(rewardAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid positive bounty reward amount.');
      return;
    }

    setIsAssigningReward(true);
    setActionSuccess(null);
    setError(null);

    try {
      const res = await rewardService.assignReward({
        reportId: id,
        amount,
        currency: rewardCurrency,
      });

      if (res.success) {
        setActionSuccess(`Bounty reward of $${amount.toLocaleString()} ${rewardCurrency} assigned!`);
        setShowRewardModal(false);
        setRewardAmount('');
        await fetchReportData();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to assign reward');
    } finally {
      setIsAssigningReward(false);
    }
  };

  // Handle Add Comment
  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsPostingComment(true);
    setError(null);

    try {
      const res = await reportService.addReportComment(id, {
        message: newComment.trim(),
        isInternal: isAdmin ? isInternalComment : false,
      });

      if (res.success) {
        setNewComment('');
        setIsInternalComment(false);
        await fetchReportData();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to post comment');
    } finally {
      setIsPostingComment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center text-cyan-400">
        <Spinner size="lg" />
        <p className="text-xs font-mono text-slate-400 mt-3">Loading Vulnerability Dossier...</p>
      </div>
    );
  }

  if (error && !report) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <Alert type="error" title="Access Restricted or Report Not Found" message={error} />
        <Link to={isAdmin ? '/admin/reports' : '/reports'}>
          <Button variant="secondary" size="sm" icon={ArrowLeft}>
            {isAdmin ? 'Back to Admin Reports' : 'Back to My Reports'}
          </Button>
        </Link>
      </div>
    );
  }

  const getSeverityBadge = (sev) => {
    const map = { low: 'researcher', medium: 'warning', high: 'danger', critical: 'danger' };
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

  // Next valid transitions based on state machine
  const getNextTransitions = (current) => {
    switch (current) {
      case 'submitted':
        return [{ target: 'under_review', label: 'Begin Review', variant: 'primary', icon: Eye }];
      case 'under_review':
        return [{ target: 'triaged', label: 'Complete Triage', variant: 'accent', icon: Sliders }];
      case 'triaged':
        return [
          { target: 'accepted', label: 'Accept Vulnerability', variant: 'primary', icon: CheckCircle2 },
          { target: 'rejected', label: 'Reject Report', variant: 'danger', icon: XCircle },
        ];
      case 'accepted':
        return [
          { target: 'reward_assigned', label: 'Mark Reward Assigned', variant: 'accent', icon: Award },
          { target: 'resolved', label: 'Resolve & Close', variant: 'secondary', icon: CheckCircle2 },
        ];
      case 'reward_assigned':
        return [{ target: 'resolved', label: 'Resolve Finding', variant: 'primary', icon: CheckCircle2 }];
      default:
        return [];
    }
  };

  const nextTransitions = isAdmin ? getNextTransitions(report.status) : [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back Link */}
      <Link
        to={isAdmin ? '/admin/reports' : '/reports'}
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>{isAdmin ? 'Back to Admin Reports Queue' : 'Back to My Reports'}</span>
      </Link>

      {actionSuccess && (
        <Alert
          type="success"
          title="Action Executed"
          message={actionSuccess}
          onClose={() => setActionSuccess(null)}
        />
      )}

      {error && (
        <Alert
          type="error"
          title="Workflow Error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {/* Header Dossier Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-cyber-border/80 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 pb-6 border-b border-slate-800">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-xs text-slate-500">REPORT #{report._id}</span>
              {getSeverityBadge(report.severity)}
              {report.originalSeverity && report.originalSeverity !== report.severity && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  (Adjusted from {report.originalSeverity})
                </span>
              )}
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

          {/* Bounty Reward Summary */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700/80 shrink-0 text-left lg:text-right space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Bounty Reward
            </span>
            <div className="text-xl font-bold font-mono text-emerald-400">
              {report.reward?.amount > 0
                ? `$${report.reward.amount.toLocaleString()} ${report.reward.currency}`
                : 'Pending Validation'}
            </div>
            <div className="flex items-center gap-2 justify-start lg:justify-end">
              <span className="text-[10px] text-slate-400">
                Status: <strong className="text-slate-200 capitalize">{report.reward?.status || 'unassigned'}</strong>
              </span>
              {isAdmin && !['reward_assigned', 'resolved', 'rejected'].includes(report.status) && (
                <button
                  onClick={() => setShowRewardModal(true)}
                  className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 underline"
                >
                  Assign Reward
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Lifecycle Status Timeline */}
        <div className="py-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Lifecycle Status:
          </p>
          <StatusTimeline currentStatus={report.status} statusHistory={report.statusHistory} />
        </div>
      </div>

      {/* Intelligent Screening & Risk Engine Insights */}
      <DuplicateInspector duplicateCheck={report.duplicateCheck} />
      <RiskScoreInspector
        riskAssessment={report.riskAssessment}
        severity={report.severity}
        riskScore={report.riskScore}
      />

      {/* Admin Triage & Actions Operations Dock (Admin Only) */}
      {isAdmin && (
        <div className="glass-panel p-6 rounded-2xl border border-cyan-500/30 bg-slate-950/80 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                <Sliders className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Administrative Triage Control Deck</h3>
                <p className="text-xs text-slate-400">
                  Enforce strict state machine transitions, update severity, and assign researcher bounties
                </p>
              </div>
            </div>

            <Badge variant="admin">Admin Authorization Active</Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Transitions */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Workflow State Transitions
              </span>
              <p className="text-xs text-slate-400">
                Current status: <strong className="text-cyan-400 capitalize">{report.status.replace(/_/g, ' ')}</strong>
              </p>

              {nextTransitions.length === 0 ? (
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
                  This report is in terminal status (<span className="text-white font-semibold">{report.status}</span>). No further automated transitions are available.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {nextTransitions.map((tr) => {
                      const Icon = tr.icon;
                      return (
                        <Button
                          key={tr.target}
                          variant={tr.variant}
                          size="sm"
                          icon={Icon}
                          isLoading={isSubmittingAction}
                          onClick={() => handleTransition(tr.target)}
                        >
                          {tr.label}
                        </Button>
                      );
                    })}

                    {['accepted', 'triaged'].includes(report.status) && (
                      <Button
                        variant="accent"
                        size="sm"
                        icon={DollarSign}
                        onClick={() => setShowRewardModal(true)}
                      >
                        Assign Bounty Reward
                      </Button>
                    )}
                  </div>

                  <input
                    type="text"
                    placeholder="Audit reason / note for transition (optional)..."
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              )}
            </div>

            {/* Severity Manager */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Administrative Severity Adjudication
              </span>
              <p className="text-xs text-slate-400">
                Original Researcher Severity: <strong className="text-slate-200 capitalize">{report.originalSeverity || report.severity}</strong>
              </p>

              <form onSubmit={handleUpdateSeverity} className="space-y-2">
                <div className="flex gap-2">
                  <select
                    value={selectedSeverity}
                    onChange={(e) => setSelectedSeverity(e.target.value)}
                    className="px-3 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="low">Low (CVSS ~3.0)</option>
                    <option value="medium">Medium (CVSS ~5.5)</option>
                    <option value="high">High (CVSS ~8.0)</option>
                    <option value="critical">Critical (CVSS ~9.8)</option>
                  </select>

                  <Button
                    type="submit"
                    variant="secondary"
                    size="sm"
                    isLoading={isUpdatingSeverity}
                  >
                    Change Severity
                  </Button>
                </div>

                <input
                  type="text"
                  placeholder="Justification for severity change (e.g. CVSS impact assessment)..."
                  value={severityReason}
                  onChange={(e) => setSeverityReason(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Two Column Layout: Main Dossier & Sidebar Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Finding Dossier & Comments (2 cols) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Finding Details */}
          <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-cyber-border/80 space-y-6">
            <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
              <Bug className="h-4 w-4 text-cyan-400" />
              <span>Technical Finding Dossier</span>
            </h2>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Description & Vulnerability Summary
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

            {/* Impact */}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          </div>

          {/* Interactive Comments & Communication Thread */}
          <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-cyber-border/80 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-cyan-400" />
                <span>Discussion & Triage Notes ({comments.length})</span>
              </h2>
              {isAdmin && (
                <span className="text-[11px] text-amber-400 font-mono">
                  Internal notes enabled
                </span>
              )}
            </div>

            {/* Comments List */}
            <div className="space-y-3">
              {comments.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-4">No comments or notes posted yet.</p>
              ) : (
                comments.map((c) => (
                  <div
                    key={c._id}
                    className={`p-4 rounded-xl border text-xs space-y-2 transition-colors ${
                      c.isInternal
                        ? 'bg-amber-950/20 border-amber-500/40 text-amber-100'
                        : 'bg-slate-900/50 border-slate-800 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">
                          {c.authorId?.name || 'Security Member'}
                        </span>
                        <Badge variant={c.authorId?.role === 'admin' ? 'admin' : 'researcher'} size="xs">
                          {c.authorId?.role}
                        </Badge>
                        {c.isInternal && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                            🔒 INTERNAL ADMIN NOTE
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">
                        {formatDate(c.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs leading-relaxed whitespace-pre-line text-slate-300">
                      {c.message}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Post Comment Input Form */}
            <form onSubmit={handlePostComment} className="space-y-3 pt-4 border-t border-slate-800">
              <label className="text-xs font-semibold text-slate-300 block">
                Add to Discussion
              </label>

              <textarea
                rows={3}
                required
                placeholder={
                  isAdmin
                    ? 'Write a public response to researcher or toggle internal admin note...'
                    : 'Add clarifying details or answer questions regarding this vulnerability...'
                }
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {isAdmin ? (
                  <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isInternalComment}
                      onChange={(e) => setIsInternalComment(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-400"
                    />
                    <span className="text-amber-400 font-semibold flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      Make Internal Admin Note (Hidden from Researcher)
                    </span>
                  </label>
                ) : (
                  <div />
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  icon={Send}
                  isLoading={isPostingComment}
                >
                  Post Message
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Sidebar (Program info, Researcher info, Audit timeline) */}
        <div className="space-y-6">
          {/* Researcher Profile Card (Admin view) */}
          {isAdmin && report.researcherId && (
            <div className="glass-panel p-5 rounded-2xl border border-cyber-border/80 space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                <User className="h-4 w-4 text-cyan-400" />
                <span>Researcher Profile</span>
              </h3>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Full Name</span>
                  <span className="font-bold text-white">{report.researcherId.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Email</span>
                  <span className="font-mono text-slate-300">{report.researcherId.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Verified Platform Reputation</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono font-bold text-cyan-400 text-sm">
                      {report.researcherId.reputation ?? 0}
                    </span>
                    <span className="text-[10px] text-slate-500">POINTS</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bounty Program Context Card */}
          {report.programId && (
            <div className="glass-panel p-5 rounded-2xl border border-cyber-border/80 space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                <Building2 className="h-4 w-4 text-cyan-400" />
                <span>Bounty Program</span>
              </h3>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Organization</span>
                  <span className="font-bold text-white">{report.programId.companyName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Program Title</span>
                  <span className="text-slate-300">{report.programId.title}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Reward Range</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    ${report.programId.rewardRange?.min?.toLocaleString()} - ${report.programId.rewardRange?.max?.toLocaleString()}
                  </span>
                </div>
                <div className="pt-1">
                  <Link
                    to={`/programs/${report.programId._id}`}
                    className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    <span>Inspect Program Scope</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Auditable Event Timeline */}
          <div className="glass-panel p-5 rounded-2xl border border-cyber-border/80 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
              <Clock className="h-4 w-4 text-cyan-400" />
              <span>Auditable Report Timeline</span>
            </h3>

            <div className="space-y-3">
              {report.timelineEvents && report.timelineEvents.length > 0 ? (
                report.timelineEvents.map((ev, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-cyan-400 uppercase text-[10px]">
                        {ev.type?.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {formatDate(ev.timestamp)}
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">{ev.notes}</p>
                    {ev.actorName && (
                      <span className="text-[10px] text-slate-400 block">
                        Actor: <strong className="text-slate-200">{ev.actorName}</strong>
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500 italic">No timeline entries yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Assign Reward Modal */}
      {showRewardModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full p-6 rounded-2xl border border-cyan-500/40 bg-slate-950 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Assign Bounty Reward</h3>
              </div>
              <button
                onClick={() => setShowRewardModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Award a financial bounty for report <strong className="text-white">#{report._id}</strong>. Assigning a reward will create an auditable reward record and automatically update report status to <span className="text-cyan-400 font-mono font-bold">reward_assigned</span>.
            </p>

            <form onSubmit={handleAssignReward} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Reward Amount ($ USD)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    placeholder="e.g. 1500"
                    value={rewardAmount}
                    onChange={(e) => setRewardAmount(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors font-mono font-bold"
                  />
                </div>
                {report.programId?.rewardRange && (
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Program guidance: ${report.programId.rewardRange.min} - ${report.programId.rewardRange.max}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRewardModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isAssigningReward}
                  icon={DollarSign}
                >
                  Confirm & Award Bounty
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportDetailsPage;
