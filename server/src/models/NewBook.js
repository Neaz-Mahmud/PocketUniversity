const mongoose = require('mongoose');

// A new book posted by an admin for sale in the store. Buyers place an order
// (with 0 delivery charge); the admin then contacts them to confirm.
const newBookSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 200 },
    author: { type: String, trim: true, maxlength: 150, default: '' },
    price: { type: Number, required: true, min: 0, default: 0 },
    description: { type: String, trim: true, maxlength: 4000, default: '' },
    coverKey: { type: String, default: null },
    stock: { type: Number, default: null }, // null = unlimited/not tracked
    active: { type: Boolean, default: true }, // whether it shows in the store
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('NewBook', newBookSchema);
