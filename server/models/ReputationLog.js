import mongoose from 'mongoose';

const reputationLogSchema = new mongoose.Schema(
  {
    researcherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VulnerabilityReport',
    },
    points: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    previousReputation: {
      type: Number,
      required: true,
    },
    newReputation: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

reputationLogSchema.index({ researcherId: 1, createdAt: -1 });

const ReputationLog = mongoose.model('ReputationLog', reputationLogSchema);

export default ReputationLog;
