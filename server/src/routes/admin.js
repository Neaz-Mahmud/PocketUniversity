const express = require('express');
const { protect, restrictTo } = require('../middleware/auth');
const {
  getDashboard,
  listUserVerifications,
  approveUserVerification,
  rejectUserVerification,
  listSectionVerifications,
  approveSectionVerification,
  rejectSectionVerification,
  listUsers,
  deleteUser,
  listSections,
  deleteSection,
  grantAdmin,
} = require('../controllers/adminController');

const router = express.Router();

// Every admin route requires an authenticated platform admin.
router.use(protect, restrictTo('admin'));

router.get('/dashboard', getDashboard);

// User verifications
router.get('/verifications/users', listUserVerifications);
router.post('/verifications/users/:id/approve', approveUserVerification);
router.post('/verifications/users/:id/reject', rejectUserVerification);

// Section verifications
router.get('/verifications/sections', listSectionVerifications);
router.post('/verifications/sections/:id/approve', approveSectionVerification);
router.post('/verifications/sections/:id/reject', rejectSectionVerification);

// Users & sections management
router.get('/users', listUsers);
router.delete('/users/:id', deleteUser);
router.get('/sections', listSections);
router.delete('/sections/:id', deleteSection);

// Admin management
router.post('/admins', grantAdmin);

module.exports = router;
