const mongoose = require('mongoose');

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
  },
  { timestamps: true }
);

module.exports = mongoose.model('Section', sectionSchema);
