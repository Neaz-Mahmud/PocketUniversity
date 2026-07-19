const mongoose = require('mongoose');

const personalFileSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    folder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PersonalFolder',
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

personalFileSchema.index({ owner: 1, status: 1 });

module.exports = mongoose.model('PersonalFile', personalFileSchema);
