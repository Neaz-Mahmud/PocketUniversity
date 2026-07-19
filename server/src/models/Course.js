const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    semester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Semester',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Course name is required'],
      trim: true,
      maxlength: [100, 'Course name cannot exceed 100 characters'],
    },
  },
  { timestamps: true }
);

courseSchema.index({ semester: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Course', courseSchema);
