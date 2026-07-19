const mongoose = require('mongoose');

const sectionMembershipSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
      required: true,
    },
    role: {
      type: String,
      enum: ['student', 'teacher', 'admin'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'removed', 'invited'],
      default: 'pending',
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    decidedAt: {
      type: Date,
      default: null,
    },
    decidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

// Prevent duplicate active/pending memberships for the same (user, section, role)
// Allow multiple 'removed' records (history)
sectionMembershipSchema.index(
  { user: 1, section: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['pending', 'active', 'invited'] } },
  }
);

sectionMembershipSchema.index({ section: 1, status: 1 });
sectionMembershipSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('SectionMembership', sectionMembershipSchema);
