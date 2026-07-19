const mongoose = require('mongoose');

// A section admin's request to a teacher (looked up by phone) asking them
// to mirror one of their Share Material courses into a specific section
// course (e.g. "Section X asking for First Semester - CSE 444").
//
// Lifecycle:
//   pending  -> teacher hasn't responded yet
//   approved -> teacher picked one of their courses (sourceFolder set);
//               a MirrorLink is created at the same time
//   rejected -> teacher declined
const mirrorRequestSchema = new mongoose.Schema(
  {
    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
      required: true,
    },
    // The section-side Semester/Course this request is for (e.g. CSE 444)
    targetSemester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Semester',
      required: true,
    },
    targetCourse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    requestedTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    // Set once the teacher approves and picks one of their own course folders
    sourceFolder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TeacherMaterialFolder',
      default: null,
    },
    decidedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// One live (pending/approved) request per (target course, teacher) at a time
mirrorRequestSchema.index(
  { targetCourse: 1, requestedTeacher: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ['pending', 'approved'] } } }
);

mirrorRequestSchema.index({ requestedTeacher: 1, status: 1 });
mirrorRequestSchema.index({ section: 1, status: 1 });

module.exports = mongoose.model('MirrorRequest', mirrorRequestSchema);
