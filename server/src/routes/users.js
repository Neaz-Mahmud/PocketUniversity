const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getMe,
  updateMe,
  presignAvatarUpload,
  confirmAvatarUpload,
  presignVerificationDoc,
  submitVerification,
  searchUsers,
} = require('../controllers/userController');

const router = express.Router();

router.use(protect);

router.get('/me', getMe);
router.patch('/me', updateMe);
router.post('/me/avatar/presign', presignAvatarUpload);
router.post('/me/avatar/confirm', confirmAvatarUpload);
router.post('/me/verification/presign', presignVerificationDoc);
router.post('/me/verification/submit', submitVerification);
router.get('/search', searchUsers);

module.exports = router;
