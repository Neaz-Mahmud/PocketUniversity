const { v4: uuidv4 } = require('uuid');
const OldBook = require('../models/OldBook');
const NewBook = require('../models/NewBook');
const BookOrder = require('../models/BookOrder');
const { isValidLocation } = require('../data/bangladesh');
const { isValidUniversity } = require('../data/universities');
const {
  generatePresignedUploadUrl,
  generatePresignedDownloadUrl,
  deleteObject,
} = require('../services/r2Service');

const { LISTING_TTL_DAYS, MAX_ACTIVE_LISTINGS, MAX_IMAGES } = OldBook;

// Attach signed image URLs to an old-book listing. `imageUrls` carries all
// photos; `coverUrl` (the first one) is kept for compact card rendering.
const withImages = async (doc) => {
  const obj = doc.toJSON ? doc.toJSON() : doc;
  obj.imageUrls = await Promise.all((obj.imageKeys || []).map((k) => generatePresignedDownloadUrl(k)));
  obj.coverUrl = obj.imageUrls[0] || null;
  return obj;
};
const mapImages = (docs) => Promise.all(docs.map(withImages));

// New books still use a single coverKey.
const withCover = async (doc) => {
  const obj = doc.toJSON ? doc.toJSON() : doc;
  obj.coverUrl = obj.coverKey ? await generatePresignedDownloadUrl(obj.coverKey) : null;
  return obj;
};
const mapCovers = (docs) => Promise.all(docs.map(withCover));

const unexpired = { expiresAt: { $gt: new Date() } };

// ─── OLD BOOKS (student marketplace) ────────────────────────────────────────

// GET /books/old  (public) — approved, unexpired listings with filters + sort.
// Query: division, zila, university, minPrice, maxPrice, q, sort, page
const listOldBooks = async (req, res) => {
  try {
    const { division, zila, university, minPrice, maxPrice, q, sort } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = 24;

    const filter = { status: 'approved', ...unexpired };
    if (division) filter.division = division;
    if (zila) filter.zila = zila;
    if (university) filter.university = university;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (q) {
      const regex = new RegExp(q.trim(), 'i');
      filter.$or = [{ title: regex }, { author: regex }];
    }

    const sortMap = {
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
    };
    const sortBy = sortMap[sort] || sortMap.newest;

    const [docs, total] = await Promise.all([
      OldBook.find(filter).sort(sortBy).skip((page - 1) * limit).limit(limit),
      OldBook.countDocuments(filter),
    ]);

    return res.json({ books: await mapImages(docs), total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /books/old/:id (public) — a single approved listing
const getOldBook = async (req, res) => {
  try {
    const book = await OldBook.findById(req.params.id).populate('seller', 'name');
    if (!book || book.status !== 'approved' || book.expiresAt <= new Date()) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    return res.json(await withImages(book));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /books/old/cover/presign (auth) — presign one photo upload
const presignOldBookCover = async (req, res) => {
  try {
    const { mimeType } = req.body;
    if (!mimeType) return res.status(400).json({ message: 'mimeType is required' });
    const ext = (mimeType.split('/')[1] || 'jpg').split('+')[0];
    const fileKey = `books/old/${req.user._id}/${uuidv4()}.${ext}`;
    const presignedUrl = await generatePresignedUploadUrl(fileKey, mimeType);
    return res.json({ fileKey, presignedUrl });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /books/old (auth) — create a listing (pending admin approval).
// Rules: ≤ MAX_IMAGES photos, ≤ MAX_ACTIVE_LISTINGS live posts per account,
// and every post expires LISTING_TTL_DAYS after creation.
const createOldBook = async (req, res) => {
  try {
    const {
      title, author, price, condition, description,
      contactEmail, contactPhone, division, zila, university, imageKeys,
    } = req.body;

    if (!title || price === undefined || !contactPhone || !division || !zila || !university) {
      return res.status(400).json({ message: 'title, price, contactPhone, division, zila and university are required' });
    }
    if (!isValidLocation(division, zila)) {
      return res.status(400).json({ message: 'Invalid division/zila selection' });
    }
    if (!isValidUniversity(university)) {
      return res.status(400).json({ message: 'Invalid university selection' });
    }

    const images = (Array.isArray(imageKeys) ? imageKeys : []).filter(Boolean);
    if (images.length > MAX_IMAGES) {
      return res.status(400).json({ message: `At most ${MAX_IMAGES} photos per listing` });
    }

    const liveCount = await OldBook.countDocuments({
      seller: req.user._id,
      status: { $in: ['pending', 'approved'] },
      ...unexpired,
    });
    if (liveCount >= MAX_ACTIVE_LISTINGS) {
      return res.status(403).json({
        message: `You can have at most ${MAX_ACTIVE_LISTINGS} live listings at a time. Delete or mark one sold first.`,
        code: 'LISTING_LIMIT',
      });
    }

    const book = await OldBook.create({
      seller: req.user._id,
      title, author, price, condition, description,
      contactEmail, contactPhone, division, zila, university,
      imageKeys: images,
      status: 'pending',
      expiresAt: new Date(Date.now() + LISTING_TTL_DAYS * 24 * 60 * 60 * 1000),
    });

    return res.status(201).json(book);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /books/old/mine (auth) — the caller's own listings (all statuses)
const myOldBooks = async (req, res) => {
  try {
    const docs = await OldBook.find({ seller: req.user._id }).sort({ createdAt: -1 });
    const books = await mapImages(docs);
    const liveCount = books.filter(
      (b) => ['pending', 'approved'].includes(b.status) && new Date(b.expiresAt) > new Date()
    ).length;
    return res.json({ books, liveCount, maxActive: MAX_ACTIVE_LISTINGS, ttlDays: LISTING_TTL_DAYS });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /books/old/mine/:id (auth) — mark own listing sold (or reopen)
const updateMyOldBook = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'sold'].includes(status)) {
      return res.status(400).json({ message: 'status must be approved or sold' });
    }
    const book = await OldBook.findOne({ _id: req.params.id, seller: req.user._id });
    if (!book) return res.status(404).json({ message: 'Listing not found' });
    // Only toggle between approved/sold; can't self-approve a pending listing.
    if (!['approved', 'sold'].includes(book.status)) {
      return res.status(400).json({ message: 'Only an approved listing can be marked sold' });
    }
    book.status = status;
    await book.save();
    return res.json(book);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const deleteListingAssets = async (book) => {
  for (const key of book.imageKeys || []) {
    try { await deleteObject(key); } catch (_) { /* ignore R2 errors */ }
  }
};

// DELETE /books/old/mine/:id (auth) — seller removes their own listing
const deleteMyOldBook = async (req, res) => {
  try {
    const book = await OldBook.findOne({ _id: req.params.id, seller: req.user._id });
    if (!book) return res.status(404).json({ message: 'Listing not found' });
    await deleteListingAssets(book);
    await book.deleteOne();
    return res.json({ message: 'Listing deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─── OLD BOOKS: admin moderation ────────────────────────────────────────────

// GET /books/admin/old?status=pending
const adminListOldBooks = async (req, res) => {
  try {
    const status = req.query.status || 'pending';
    const docs = await OldBook.find({ status })
      .sort({ createdAt: -1 })
      .populate('seller', 'name email phone');
    return res.json(await mapImages(docs));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /books/admin/old/:id/approve
const approveOldBook = async (req, res) => {
  try {
    const book = await OldBook.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Listing not found' });
    book.status = 'approved';
    book.rejectionReason = null;
    book.reviewedBy = req.user._id;
    book.reviewedAt = new Date();
    await book.save();
    return res.json(book);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /books/admin/old/:id/reject  { reason }
const rejectOldBook = async (req, res) => {
  try {
    const book = await OldBook.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Listing not found' });
    book.status = 'rejected';
    book.rejectionReason = req.body.reason || 'Listing did not meet the guidelines';
    book.reviewedBy = req.user._id;
    book.reviewedAt = new Date();
    await book.save();
    return res.json(book);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /books/admin/old/:id
const adminDeleteOldBook = async (req, res) => {
  try {
    const book = await OldBook.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Listing not found' });
    await deleteListingAssets(book);
    await book.deleteOne();
    return res.json({ message: 'Listing deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Called by the cleanup job: delete listings whose 60-day life has ended.
const purgeExpiredListings = async () => {
  const expired = await OldBook.find({ expiresAt: { $lte: new Date() } });
  for (const book of expired) {
    await deleteListingAssets(book);
    await book.deleteOne();
  }
  return expired.length;
};

// ─── NEW BOOKS (admin store) ────────────────────────────────────────────────

// GET /books/new (public) — active store items
const listNewBooks = async (req, res) => {
  try {
    const docs = await NewBook.find({ active: true }).sort({ createdAt: -1 });
    return res.json(await mapCovers(docs));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /books/new/:id (public)
const getNewBook = async (req, res) => {
  try {
    const book = await NewBook.findById(req.params.id);
    if (!book || !book.active) return res.status(404).json({ message: 'Book not found' });
    return res.json(await withCover(book));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /books/admin/new/cover/presign
const presignNewBookCover = async (req, res) => {
  try {
    const { mimeType } = req.body;
    if (!mimeType) return res.status(400).json({ message: 'mimeType is required' });
    const ext = (mimeType.split('/')[1] || 'jpg').split('+')[0];
    const fileKey = `books/new/${uuidv4()}.${ext}`;
    const presignedUrl = await generatePresignedUploadUrl(fileKey, mimeType);
    return res.json({ fileKey, presignedUrl });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /books/admin/new
const createNewBook = async (req, res) => {
  try {
    const { title, author, price, description, coverKey, stock, active } = req.body;
    if (!title) return res.status(400).json({ message: 'title is required' });
    const book = await NewBook.create({
      title, author, price: price || 0, description,
      coverKey: coverKey || null,
      stock: stock === '' || stock === undefined ? null : Number(stock),
      active: active !== false,
      postedBy: req.user._id,
    });
    return res.status(201).json(book);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /books/admin/new/:id
const updateNewBook = async (req, res) => {
  try {
    const allowed = ['title', 'author', 'price', 'description', 'coverKey', 'stock', 'active'];
    const update = {};
    for (const k of allowed) if (req.body[k] !== undefined) update[k] = req.body[k];
    const book = await NewBook.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!book) return res.status(404).json({ message: 'Book not found' });
    return res.json(book);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /books/admin/new/:id
const deleteNewBook = async (req, res) => {
  try {
    const book = await NewBook.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    if (book.coverKey) { try { await deleteObject(book.coverKey); } catch (_) { /* ignore */ } }
    await book.deleteOne();
    return res.json({ message: 'Book deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─── ORDERS (new books) ─────────────────────────────────────────────────────

// POST /books/new/:id/order (optional auth) — place an order, 0 delivery charge
const placeOrder = async (req, res) => {
  try {
    const book = await NewBook.findById(req.params.id);
    if (!book || !book.active) return res.status(404).json({ message: 'Book not available' });

    const { name, phone, email, address, note, quantity } = req.body;
    if (!name || !phone) return res.status(400).json({ message: 'name and phone are required' });

    const order = await BookOrder.create({
      book: book._id,
      buyer: req.user?._id || null,
      name, phone, email, address, note,
      quantity: Math.max(1, Number(quantity) || 1),
      deliveryCharge: 0,
      status: 'pending',
    });

    return res.status(201).json({ message: 'Order placed — the admin will contact you to confirm.', orderId: order._id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /books/admin/orders?status=
const adminListOrders = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const orders = await BookOrder.find(filter)
      .sort({ createdAt: -1 })
      .populate('book', 'title author price coverKey');
    return res.json(orders);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /books/admin/orders/:id  { status }
const adminUpdateOrder = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'confirmed', 'cancelled', 'delivered'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const order = await BookOrder.findByIdAndUpdate(req.params.id, { status }, { new: true })
      .populate('book', 'title author price coverKey');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    return res.json(order);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  // old books — public + seller
  listOldBooks, getOldBook, presignOldBookCover, createOldBook,
  myOldBooks, updateMyOldBook, deleteMyOldBook,
  // old books — admin
  adminListOldBooks, approveOldBook, rejectOldBook, adminDeleteOldBook,
  purgeExpiredListings,
  // new books
  listNewBooks, getNewBook, presignNewBookCover, createNewBook, updateNewBook, deleteNewBook,
  // orders
  placeOrder, adminListOrders, adminUpdateOrder,
};
