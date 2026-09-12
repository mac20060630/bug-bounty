import Comment from '../models/Comment.js';
import VulnerabilityReport from '../models/VulnerabilityReport.js';

export const addComment = async ({ reportId, message, isInternal = false }, user) => {
  const report = await VulnerabilityReport.findById(reportId);
  if (!report) {
    const err = new Error('Vulnerability report not found');
    err.statusCode = 404;
    throw err;
  }

  // IDOR check for researcher
  if (user.role === 'researcher') {
    if (report.researcherId.toString() !== user._id.toString()) {
      const err = new Error('Access denied: You do not own this report.');
      err.statusCode = 403;
      throw err;
    }
  }

  // Researchers can never author internal notes
  const effectiveIsInternal = user.role === 'admin' ? Boolean(isInternal) : false;

  const comment = new Comment({
    reportId,
    authorId: user._id,
    message: message.trim(),
    isInternal: effectiveIsInternal,
  });

  await comment.save();

  // Add timeline event
  report.timelineEvents.push({
    type: effectiveIsInternal ? 'internal_note_added' : 'comment_added',
    actor: user._id,
    message: effectiveIsInternal
      ? `Internal security note added by ${user.name}`
      : `Comment posted by ${user.name} (${user.role})`,
    metadata: { isInternal: effectiveIsInternal },
    timestamp: new Date(),
  });

  await report.save();

  return comment.populate('authorId', 'name email role');
};

export const getCommentsByReport = async (reportId, user) => {
  const report = await VulnerabilityReport.findById(reportId);
  if (!report) {
    const err = new Error('Vulnerability report not found');
    err.statusCode = 404;
    throw err;
  }

  // IDOR check for researcher
  if (user.role === 'researcher') {
    if (report.researcherId.toString() !== user._id.toString()) {
      const err = new Error('Access denied: You do not own this report.');
      err.statusCode = 403;
      throw err;
    }
  }

  const query = { reportId };

  // Strict privacy filter: Researchers can NEVER see internal admin notes!
  if (user.role !== 'admin') {
    query.isInternal = false;
  }

  return Comment.find(query)
    .sort({ createdAt: 1 })
    .populate('authorId', 'name email role');
};
