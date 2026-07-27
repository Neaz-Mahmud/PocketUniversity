const express = require('express');
const { protect, restrictTo, optionalAuth } = require('../middleware/auth');
const c = require('../controllers/bookController');

const router = express.Router();

// ─── Admin (place before param routes so /admin isn't swallowed) ─────────────
const admin = [protect, restrictTo('admin')];
router.get('/admin/old', ...admin, c.adminListOldBooks);
router.post('/admin/old/:id/approve', ...admin, c.approveOldBook);
router.post('/admin/old/:id/reject', ...admin, c.rejectOldBook);
router.delete('/admin/old/:id', ...admin, c.adminDeleteOldBook);

router.post('/admin/new/cover/presign', ...admin, c.presignNewBookCover);
router.post('/admin/new', ...admin, c.createNewBook);
router.patch('/admin/new/:id', ...admin, c.updateNewBook);
router.delete('/admin/new/:id', ...admin, c.deleteNewBook);

router.get('/admin/orders', ...admin, c.adminListOrders);
router.patch('/admin/orders/:id', ...admin, c.adminUpdateOrder);

// ─── Old books: seller (auth) ────────────────────────────────────────────────
router.post('/old/cover/presign', protect, c.presignOldBookCover);
router.get('/old/mine', protect, c.myOldBooks);
router.patch('/old/mine/:id', protect, c.updateMyOldBook);
router.delete('/old/mine/:id', protect, c.deleteMyOldBook);
router.post('/old', protect, c.createOldBook);

// ─── Old books: public ───────────────────────────────────────────────────────
router.get('/old', c.listOldBooks);
router.get('/old/:id', c.getOldBook);

// ─── New books: public + order ───────────────────────────────────────────────
router.get('/new', c.listNewBooks);
router.get('/new/:id', c.getNewBook);
router.post('/new/:id/order', optionalAuth, c.placeOrder);

module.exports = router;
