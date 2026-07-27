const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Verification is a shared concept for students (student ID card + optional NID)
// and teachers (teacher ID card). The verified state is what unlocks the higher
// storage tier (see services/quotaService).
const verificationSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['unverified', 'pending', 'verified', 'rejected'],
      default: 'unverified',
    },
    idCardKey: { type: String, default: null }, // student ID card / teacher ID card in R2
    nidKey: { type: String, default: null }, // optional National ID (students)
    submittedAt: { type: Date, default: null },
    reviewedAt: { type: Date, default: null },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    rejectionReason: { type: String, default: null },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ['student', 'teacher', 'admin'],
      required: [true, 'Role is required'],
    },
    profilePicKey: {
      type: String,
      default: null,
    },

    // ─── Academic profile (students) ──────────────────────────────────────────
    // A verified student profile must carry these; they are collected on the
    // Profile page and locked once verification is approved.
    university: { type: String, default: null, trim: true },
    sectionName: { type: String, default: null, trim: true }, // free-text section label, e.g. "63_G"
    batch: { type: String, default: null, trim: true },
    studentId: { type: String, default: null, trim: true },

    // ─── Verification ─────────────────────────────────────────────────────────
    verification: { type: verificationSchema, default: () => ({}) },

    // A brand-new unverified account is on a deletion clock: if no verification
    // request is submitted within the grace window, the cleanup job removes it.
    // Set at creation for student/teacher accounts; cleared once a request is
    // submitted (status leaves 'unverified'). Admins are never on the clock.
    deletionDueAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

// Compare password helper
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

userSchema.methods.isVerified = function () {
  return this.verification?.status === 'verified';
};

// Never expose passwordHash in JSON responses
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
