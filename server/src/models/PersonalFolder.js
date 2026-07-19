const mongoose = require('mongoose');

const personalFolderSchema = new mongoose.Schema(
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
      ref: 'PersonalFolder',
      default: null,
    },
  },
  { timestamps: true }
);

// Prevent duplicate folder names within the same parent for the same owner
personalFolderSchema.index({ owner: 1, parentFolder: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('PersonalFolder', personalFolderSchema);
