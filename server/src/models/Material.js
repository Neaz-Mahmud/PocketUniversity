const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
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
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'active'],
      default: 'pending',
    },
    // Set when this Material was auto-created by a mirror link rather than
    // uploaded directly by an admin. Points at the teacher's original
    // Share Material file. The two rows share the same fileKey (R2 object) —
    // mirroring is by reference, no duplicate storage.
    mirroredFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TeacherMaterialFile',
      default: null,
    },
  },
  { timestamps: true }
);

materialSchema.index({ course: 1, status: 1 });
materialSchema.index({ mirroredFrom: 1 });

module.exports = mongoose.model('Material', materialSchema);
