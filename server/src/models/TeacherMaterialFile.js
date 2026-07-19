const mongoose = require('mongoose');

// A file the teacher uploaded into one of their Share Material course
// folders. Whenever one of these is confirmed and its folder is linked to
// one or more section courses (via MirrorLink), a mirrored Material is
// auto-created in each linked section course, pointing at the same R2
// object (fileKey) — no duplicate storage, no re-upload.
const teacherMaterialFileSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    folder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TeacherMaterialFolder',
      required: true,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    fileKey: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
      min: 0,
    },
    mimeType: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'active'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

teacherMaterialFileSchema.index({ owner: 1, status: 1 });
teacherMaterialFileSchema.index({ folder: 1, status: 1 });

module.exports = mongoose.model('TeacherMaterialFile', teacherMaterialFileSchema);
