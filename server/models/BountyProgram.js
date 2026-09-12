import mongoose from 'mongoose';

const bountyProgramSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: [true, 'Company or organization name is required'],
      trim: true,
      minlength: [2, 'Company name must be at least 2 characters'],
      maxlength: [120, 'Company name cannot exceed 120 characters'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Program title is required'],
      trim: true,
      minlength: [3, 'Program title must be at least 3 characters'],
      maxlength: [150, 'Program title cannot exceed 150 characters'],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Program description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters long'],
    },
    scope: {
      inScope: [
        {
          target: { type: String, required: true, trim: true },
          type: {
            type: String,
            enum: ['web', 'api', 'mobile', 'hardware', 'cloud', 'other'],
            default: 'web',
          },
          description: { type: String, default: '' },
        },
      ],
      outOfScope: [
        {
          target: { type: String, required: true, trim: true },
          description: { type: String, default: '' },
        },
      ],
    },
    rules: {
      type: String,
      required: [true, 'Program rules and disclosure guidelines are required'],
      trim: true,
      default:
        '1. Respect privacy and do not alter customer data.\n2. Do not conduct Denial of Service (DoS) attacks.\n3. Report vulnerabilities promptly with clear reproduction steps.\n4. Maintain confidentiality until authorized disclosure.',
    },
    rewardRange: {
      min: {
        type: Number,
        default: 0,
        min: [0, 'Minimum reward cannot be negative'],
      },
      max: {
        type: Number,
        required: [true, 'Maximum reward is required'],
        min: [0, 'Maximum reward cannot be negative'],
      },
      currency: {
        type: String,
        default: 'USD',
        uppercase: true,
        trim: true,
      },
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'paused', 'closed'],
        message: 'Status must be active, paused, or closed',
      },
      default: 'active',
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for searching & filtering
bountyProgramSchema.index({ status: 1, createdAt: -1 });
bountyProgramSchema.index({ companyName: 'text', title: 'text', description: 'text' });

const BountyProgram = mongoose.model('BountyProgram', bountyProgramSchema);

export default BountyProgram;
