import VulnerabilityReport from '../models/VulnerabilityReport.js';
import { awardReputationForReport } from './reputationService.js';
import { createNotification } from './notificationService.js';

// Centralized state transition graph
export const VALID_TRANSITIONS = {
  submitted: ['under_review', 'rejected'],
  under_review: ['triaged', 'rejected'],
  triaged: ['accepted', 'rejected'],
  accepted: ['reward_assigned', 'resolved'],
  reward_assigned: ['resolved'],
  rejected: ['under_review'], // Allow reopening upon appeal
  resolved: [],
};

export const canTransition = (currentStatus, targetStatus) => {
  const allowed = VALID_TRANSITIONS[currentStatus] || [];
  return allowed.includes(targetStatus);
};

export const transitionReportStatus = async (reportId, targetStatus, note = '', adminUser) => {
  const report = await VulnerabilityReport.findById(reportId)
    .populate('researcherId', 'name email reputation')
    .populate('programId', 'companyName title');

  if (!report) {
    const err = new Error('Vulnerability report not found');
    err.statusCode = 404;
    throw err;
  }

  const currentStatus = report.status;

  if (currentStatus === targetStatus) {
    return report;
  }

  if (!canTransition(currentStatus, targetStatus)) {
    const err = new Error(
      `Invalid workflow transition from '${currentStatus}' to '${targetStatus}'. Allowed transitions: [${(
        VALID_TRANSITIONS[currentStatus] || []
      ).join(', ')}]`
    );
    err.statusCode = 400;
    throw err;
  }

  // Update status & history
  report.status = targetStatus;
  report.statusHistory.push({
    fromStatus: currentStatus,
    toStatus: targetStatus,
    changedBy: adminUser._id,
    note: note || `Report transitioned to ${targetStatus} by ${adminUser.name}.`,
    timestamp: new Date(),
  });

  // Log timeline event
  const timelineType =
    targetStatus === 'accepted'
      ? 'status_changed'
      : targetStatus === 'resolved'
      ? 'report_resolved'
      : 'status_changed';

  report.timelineEvents.push({
    type: timelineType,
    actor: adminUser._id,
    message: `Status transitioned from ${currentStatus} to ${targetStatus}`,
    metadata: { fromStatus: currentStatus, toStatus: targetStatus, note },
    timestamp: new Date(),
  });

  // SIDE EFFECT: If transitioning to 'accepted', award reputation to researcher
  if (targetStatus === 'accepted') {
    try {
      const repResult = await awardReputationForReport(
        report.researcherId._id,
        report._id,
        report.severity
      );

      report.timelineEvents.push({
        type: 'status_changed',
        actor: adminUser._id,
        message: `Awarded +${repResult.points} reputation points to researcher.`,
        metadata: repResult,
        timestamp: new Date(),
      });
    } catch (repErr) {
      console.error('[Reputation] Error awarding reputation:', repErr.message);
    }
  }

  await report.save();

  // Notify researcher of status transition
  try {
    const notifyTypeMap = {
      under_review: 'report_reviewed',
      accepted: 'report_accepted',
      rejected: 'report_rejected',
      resolved: 'report_resolved',
    };

    const nType = notifyTypeMap[targetStatus] || 'status_changed';
    const researcherId = report.researcherId?._id || report.researcherId;

    if (researcherId) {
      await createNotification({
        userId: researcherId,
        type: nType,
        message: `Your report "${report.title}" has been updated to "${targetStatus.replace(/_/g, ' ')}".`,
        data: {
          reportId: report._id,
          status: targetStatus,
          note,
        },
      });
    }
  } catch (notifyErr) {
    console.error('[Notification] Failed to send status change notification:', notifyErr.message);
  }

  return report;
};

export const updateReportSeverity = async (reportId, newSeverity, adminUser) => {
  const allowed = ['low', 'medium', 'high', 'critical'];
  const formatted = newSeverity?.toLowerCase();

  if (!allowed.includes(formatted)) {
    const err = new Error(`Invalid severity. Must be one of: ${allowed.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  const report = await VulnerabilityReport.findById(reportId);
  if (!report) {
    const err = new Error('Vulnerability report not found');
    err.statusCode = 404;
    throw err;
  }

  const oldSeverity = report.severity;
  if (!report.originalSeverity) {
    report.originalSeverity = oldSeverity;
  }

  report.severity = formatted;

  // Update CVSS risk score mapping
  const severityScoreMap = { low: 3.5, medium: 5.5, high: 7.5, critical: 9.5 };
  report.riskScore = severityScoreMap[formatted] || 5.0;

  // Log timeline event
  report.timelineEvents.push({
    type: 'severity_changed',
    actor: adminUser._id,
    message: `Severity adjusted from ${oldSeverity} to ${formatted}`,
    metadata: { oldSeverity, newSeverity: formatted, riskScore: report.riskScore },
    timestamp: new Date(),
  });

  await report.save();

  // Notify researcher of severity adjustment
  try {
    if (report.researcherId) {
      await createNotification({
        userId: report.researcherId,
        type: 'severity_changed',
        message: `Severity on your report "${report.title}" was adjusted to ${formatted.toUpperCase()}.`,
        data: {
          reportId: report._id,
          oldSeverity,
          newSeverity: formatted,
        },
      });
    }
  } catch (notifyErr) {
    console.error('[Notification] Failed to send severity change notification:', notifyErr.message);
  }

  return report;
};
