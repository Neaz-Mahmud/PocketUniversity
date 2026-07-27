const mongoose = require('mongoose');

// A student's used-book sale post. Becomes publicly visible only after an admin
// approves it. Buyers filter by division/zila/university/price and contact the
// seller directly via the contact details on the listing.
//
// Marketplace rules (enforced in bookController):
//  - max 2 photos per listing
//  - a listing lives at most 60 days (expiresAt), then the cleanup job removes it
//  - an account may hold at most 10 live (pending/approved) listings at a time
const LISTING_TTL_DAYS = 60;
const MAX_ACTIVE_LISTINGS = 10;
const MAX_IMAGES = 2;

const oldBookSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 200 },
    author: { type: String, trim: true, maxlength: 150, default: '' },
    price: { type: Number, required: [true, 'Price is required'], min: 0 },
    condition: {
      type: String,
      enum: ['new', 'like-new', 'good', 'fair'],
      default: 'good',
    },
    description: { type: String, trim: true, maxlength: 2000, default: '' },

    // Contact (shown publicly so buyers can reach the seller)
    contactEmail: { type: String, trim: true, lowercase: true, default: '' },
    contactPhone: { type: String, required: [true, 'A contact phone is required'], trim: true },

    // Location + university, constrained to the prebuilt dataset (validated in controller)
    division: { type: String, required: true, trim: true },
    zila: { type: String, required: true, trim: true },
    university: { type: String, required: true, trim: true },

    // Up to MAX_IMAGES photos of the book, stored in R2
    imageKeys: {
      type: [String],
      default: [],
      validate: [(arr) => arr.length <= MAX_IMAGES, `At most ${MAX_IMAGES} photos allowed`],
    },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'sold'],
      default: 'pending',
    },
    // Hard lifetime of the listing, set at creation. The public feed only shows
    // unexpired posts; the cleanup job deletes past-due ones outright.
    expiresAt: { type: Date, required: true },

    rejectionReason: { type: String, default: null },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

oldBookSchema.index({ status: 1, division: 1, zila: 1, university: 1, price: 1 });
oldBookSchema.index({ seller: 1, status: 1 });
oldBookSchema.index({ expiresAt: 1 });

const OldBook = mongoose.model('OldBook', oldBookSchema);
module.exports = OldBook;
module.exports.LISTING_TTL_DAYS = LISTING_TTL_DAYS;
module.exports.MAX_ACTIVE_LISTINGS = MAX_ACTIVE_LISTINGS;
module.exports.MAX_IMAGES = MAX_IMAGES;
