const mongoose = require('mongoose');

// A section is verified by its CR uploading their student ID card. Verification
// lifts the section storage cap from 100 MB to 3 GB (see quotaService /
// sectionContentController). An unverified section that never submits a request
// within the grace window is auto-removed by the cleanup job.
const sectionVerificationSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['unverified', 'pending', 'verified', 'rejected'],
      default: 'unverified',
    },
    idCardKey: { type: String, default: null }, // CR's student ID card in R2
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    submittedAt: { type: Date, default: null },
    reviewedAt: { type: Date, default: null },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    rejectionReason: { type: String, default: null },
  },
  { _id: false }
);

const sectionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Section name is required'],
      trim: true,
      maxlength: [150, 'Section name cannot exceed 150 characters'],
    },
    uniqueId: {
      type: String,
      required: [true, 'Unique ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    contactPhone: {
      type: String,
      required: [true, 'Contact phone is required'],
      trim: true,
    },
    storageUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
    verification: { type: sectionVerificationSchema, default: () => ({}) },
    // Deletion clock for unverified sections (mirrors User.deletionDueAt).
    deletionDueAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Section', sectionSchema);
