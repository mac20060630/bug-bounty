import VulnerabilityReport from '../models/VulnerabilityReport.js';
import BountyProgram from '../models/BountyProgram.js';

export const createReport = async (reportData, researcherId) => {
  // Validate that the target program exists and is active
  const program = await BountyProgram.findById(reportData.programId);
  if (!program) {
    const error = new Error('Target bounty program does not exist.');
    error.statusCode = 404;
    throw error;
  }

  if (program.status !== 'active') {
    const error = new Error(
      `Cannot submit reports to this program because it is currently '${program.status}'.`
    );
    error.statusCode = 400;
    throw error;
  }

  // Calculate base CVSS risk score mapping based on untrusted researcher input
  const severityScoreMap = {
    low: 3.5,
    medium: 5.5,
    high: 7.5,
    critical: 9.5,
  };

  const riskScore = severityScoreMap[reportData.severity] || 5.0;

  const report = new VulnerabilityReport({
    ...reportData,
    researcherId,
    riskScore,
    status: 'submitted',
    statusHistory: [
      {
        toStatus: 'submitted',
        changedBy: researcherId,
        note: 'Initial vulnerability report submitted by researcher.',
        timestamp: new Date(),
      },
    ],
  });

  await report.save();
  return report.populate([
    { path: 'researcherId', select: 'name email reputation' },
    { path: 'programId', select: 'companyName title rewardRange' },
  ]);
};

export const getReports = async ({ programId, status, page = 1, limit = 20 }, user) => {
  const query = {};

  // Strict authorization: Researchers can only ever see their own reports
  if (user.role === 'researcher') {
    query.researcherId = user._id;
  }

  if (programId) {
    query.programId = programId;
  }

  if (status) {
    query.status = status;
  }

  const skip = (Math.max(1, page) - 1) * limit;

  const [reports, total] = await Promise.all([
    VulnerabilityReport.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('researcherId', 'name email reputation')
      .populate('programId', 'companyName title rewardRange'),
    VulnerabilityReport.countDocuments(query),
  ]);

  return {
    reports,
    pagination: {
      total,
      page: Number(page),
      pages: Math.ceil(total / limit) || 1,
      limit: Number(limit),
    },
  };
};

export const getReportById = async (id, user) => {
  const report = await VulnerabilityReport.findById(id)
    .populate('researcherId', 'name email reputation')
    .populate('programId', 'companyName title rewardRange rules scope');

  if (!report) {
    const error = new Error('Vulnerability report not found.');
    error.statusCode = 404;
    throw error;
  }

  // IDOR Protection: Researchers can ONLY view their own reports
  if (
    user.role === 'researcher' &&
    report.researcherId._id.toString() !== user._id.toString()
  ) {
    const error = new Error('Access denied: You are not authorized to view this report.');
    error.statusCode = 403;
    throw error;
  }

  return report;
};

export const updateReport = async (id, updates, user) => {
  const report = await VulnerabilityReport.findById(id);

  if (!report) {
    const error = new Error('Vulnerability report not found.');
    error.statusCode = 404;
    throw error;
  }

  // If user is a researcher:
  if (user.role === 'researcher') {
    // IDOR Check
    if (report.researcherId.toString() !== user._id.toString()) {
      const error = new Error('Access denied: You do not own this report.');
      error.statusCode = 403;
      throw error;
    }

    // Researchers can only update editable fields when still in 'submitted' state
    if (report.status !== 'submitted') {
      const error = new Error('Cannot edit report once triage or review has begun.');
      error.statusCode = 400;
      throw error;
    }

    const editableFields = [
      'title',
      'description',
      'category',
      'affectedAsset',
      'reproductionSteps',
      'impact',
      'suggestedRemediation',
      'severity',
      'evidence',
    ];

    editableFields.forEach((field) => {
      if (updates[field] !== undefined) {
        report[field] = updates[field];
      }
    });
  }

  // If user is an admin:
  if (user.role === 'admin') {
    // Admin can update status (e.g. submitted -> under_review)
    if (updates.status && updates.status !== report.status) {
      report.statusHistory.push({
        fromStatus: report.status,
        toStatus: updates.status,
        changedBy: user._id,
        note: updates.statusNote || `Status updated to ${updates.status} by administrator.`,
        timestamp: new Date(),
      });
      report.status = updates.status;
    }

    if (updates.severity) {
      report.severity = updates.severity;
    }

    if (updates.riskScore !== undefined) {
      report.riskScore = updates.riskScore;
    }
  }

  await report.save();
  return report.populate([
    { path: 'researcherId', select: 'name email reputation' },
    { path: 'programId', select: 'companyName title rewardRange' },
  ]);
};

export const deleteReport = async (id, user) => {
  const report = await VulnerabilityReport.findById(id);

  if (!report) {
    const error = new Error('Vulnerability report not found.');
    error.statusCode = 404;
    throw error;
  }

  // IDOR check for researcher
  if (
    user.role === 'researcher' &&
    report.researcherId.toString() !== user._id.toString()
  ) {
    const error = new Error('Access denied: You do not own this report.');
    error.statusCode = 403;
    throw error;
  }

  // Researcher can only withdraw if status is 'submitted'
  if (user.role === 'researcher' && report.status !== 'submitted') {
    const error = new Error('Cannot withdraw a report that has already entered triage.');
    error.statusCode = 400;
    throw error;
  }

  await VulnerabilityReport.findByIdAndDelete(id);

  return { message: 'Vulnerability report withdrawn successfully.', id };
};
