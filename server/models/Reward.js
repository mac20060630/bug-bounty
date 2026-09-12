import mongoose from 'mongoose';

const rewardSchema = new mongoose.Schema(
  {
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VulnerabilityReport',
      required: true,
      index: true,
    },
    researcherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    programId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BountyProgram',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Reward amount is required'],
      min: [1, 'Reward amount must be at least $1'],
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['awarded', 'paid'],
      default: 'awarded',
      index: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

rewardSchema.index({ researcherId: 1, createdAt: -1 });
rewardSchema.index({ programId: 1, createdAt: -1 });

const Reward = mongoose.model('Reward', rewardSchema);

export default Reward;
