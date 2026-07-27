const express = require('express');
const { protect, restrictTo } = require('../middleware/auth');
const c = require('../controllers/jobController');

const router = express.Router();
const admin = [protect, restrictTo('admin')];

// Admin (before param routes)
router.get('/admin', ...admin, c.adminListJobs);
router.post('/admin', ...admin, c.createJob);
router.post('/admin/upload/presign', ...admin, c.presignJobAsset);
router.get('/admin/:id', ...admin, c.adminGetJob);
router.patch('/admin/:id', ...admin, c.updateJob);
router.delete('/admin/:id', ...admin, c.deleteJob);

// Public
router.get('/', c.listJobs);
router.get('/:id', c.getJob);

module.exports = router;
