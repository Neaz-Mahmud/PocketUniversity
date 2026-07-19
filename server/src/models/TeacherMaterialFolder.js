const mongoose = require('mongoose');

// Teacher-owned Semester -> Course folder tree, used by the "Share Material"
// panel. Mirrors PersonalFolder's shape but is kept as a separate collection
// since these courses can be linked to Sections via MirrorLink and are not
// counted against personal-storage quota.
const teacherMaterialFolderSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['semester', 'course'],
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Folder name is required'],
      trim: true,
      maxlength: [100, 'Folder name cannot exceed 100 characters'],
    },
    parentFolder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TeacherMaterialFolder',
      default: null,
    },
  },
  { timestamps: true }
);

teacherMaterialFolderSchema.index({ owner: 1, parentFolder: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('TeacherMaterialFolder', teacherMaterialFolderSchema);
