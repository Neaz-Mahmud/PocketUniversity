const mongoose = require('mongoose');

const semesterSchema = new mongoose.Schema(
  {
    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Semester name is required'],
      trim: true,
      maxlength: [100, 'Semester name cannot exceed 100 characters'],
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

semesterSchema.index({ section: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Semester', semesterSchema);
