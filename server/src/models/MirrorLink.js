const mongoose = require('mongoose');

// An active link created once a MirrorRequest is approved: every file the
// teacher uploads into `sourceFolder` (a Share Material course) from now on
// gets auto-mirrored into `targetCourse` (a section course).
//
// Kept separate from MirrorRequest so a teacher can later unlink without
// losing the request history, and so one source course can (in principle)
// feed multiple section courses.
const mirrorLinkSchema = new mongoose.Schema(
  {
    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
      required: true,
    },
    targetCourse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    sourceFolder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TeacherMaterialFolder',
      required: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    mirrorRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MirrorRequest',
      required: true,
    },
  },
  { timestamps: true }
);

mirrorLinkSchema.index({ targetCourse: 1 }, { unique: true });
mirrorLinkSchema.index({ sourceFolder: 1 });

module.exports = mongoose.model('MirrorLink', mirrorLinkSchema);
