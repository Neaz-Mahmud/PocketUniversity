const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema(
  {
    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    type: {
      type: String,
      enum: ['general', 'ct', 'assignment', 'labtest', 'custom'],
      required: [true, 'Notice type is required'],
    },
    occurrenceDate: {
      type: Date,
      default: null,
    },
    mentionedTeachers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

noticeSchema.index({ section: 1, occurrenceDate: 1 });
noticeSchema.index({ mentionedTeachers: 1, occurrenceDate: 1 });
noticeSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model('Notice', noticeSchema);
