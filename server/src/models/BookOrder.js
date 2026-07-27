const mongoose = require('mongoose');

// An order placed against a new (admin-posted) book. Delivery is always free.
// After it's placed, an admin contacts the buyer to confirm whether they'll
// actually take the book, and moves the order through the status flow.
const bookOrderSchema = new mongoose.Schema(
  {
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'NewBook', required: true },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // set if logged in

    // Contact snapshot captured at order time
    name: { type: String, required: [true, 'Your name is required'], trim: true },
    phone: { type: String, required: [true, 'A contact phone is required'], trim: true },
    email: { type: String, trim: true, lowercase: true, default: '' },
    address: { type: String, trim: true, default: '' },
    note: { type: String, trim: true, maxlength: 500, default: '' },
    quantity: { type: Number, default: 1, min: 1 },

    deliveryCharge: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'delivered'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BookOrder', bookOrderSchema);
