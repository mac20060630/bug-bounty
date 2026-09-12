import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    type: {
      type: String,
      required: [true, 'Notification type is required'],
      enum: {
        values: [
          'report_submitted',
          'report_reviewed',
          'status_changed',
          'severity_changed',
          'report_accepted',
          'report_rejected',
          'bounty_assigned',
          'report_resolved',
          'comment_added',
          'duplicate_detected',
          'system',
        ],
        message: 'Invalid notification type',
      },
      index: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    data: {
      reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'VulnerabilityReport' },
      programId: { type: mongoose.Schema.Types.ObjectId, ref: 'BountyProgram' },
      amount: { type: Number },
      currency: { type: String },
      severity: { type: String },
      status: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for fast querying and unread counts
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
