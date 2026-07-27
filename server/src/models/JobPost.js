const mongoose = require('mongoose');

// A recruitment guide posted by an admin: how a company/organization hires for a
// given post. The body is an ordered list of content blocks so an admin can mix
// text, images, an embedded YouTube video, and downloadable PDF/DOCX files.
const blockSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['text', 'image', 'youtube', 'file', 'react'], required: true },
    text: { type: String, default: '' },       // for type 'text'
    imageKey: { type: String, default: null },  // for type 'image' (R2)
    youtubeUrl: { type: String, default: '' },  // for type 'youtube'
    fileKey: { type: String, default: null },   // for type 'file' (R2)
    fileName: { type: String, default: '' },    // original download name
    // for type 'react': JSX source authored by the admin, rendered for readers
    // inside a sandboxed iframe (see client ReactBlock) — it never executes in
    // the app's own context.
    code: { type: String, default: '', maxlength: 50000 },
  },
  { _id: false }
);

const jobPostSchema = new mongoose.Schema(
  {
    organization: { type: String, required: [true, 'Organization/company name is required'], trim: true, maxlength: 200 },
    position: { type: String, trim: true, maxlength: 200, default: '' }, // the post (may be blank)
    category: { type: String, enum: ['government', 'non-government', 'other'], default: 'other' },
    summary: { type: String, trim: true, maxlength: 500, default: '' },
    coverKey: { type: String, default: null },
    blocks: { type: [blockSchema], default: [] },
    published: { type: Boolean, default: true },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

jobPostSchema.index({ published: 1, category: 1, createdAt: -1 });

module.exports = mongoose.model('JobPost', jobPostSchema);
