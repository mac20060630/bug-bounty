import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VulnerabilityReport',
      required: true,
      index: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: [true, 'Comment message is required'],
      trim: true,
      minlength: [1, 'Comment cannot be empty'],
      maxlength: [2000, 'Comment cannot exceed 2000 characters'],
    },
    isInternal: {
      type: Boolean,
      default: false,
      index: true, // True = internal security team note only; False = public to researcher
    },
  },
  {
    timestamps: true,
  }
);

commentSchema.index({ reportId: 1, createdAt: 1 });

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;
