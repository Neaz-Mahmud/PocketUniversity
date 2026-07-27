const User = require('../models/User');
const { getQuotaInfo } = require('../services/quotaService');
const { generatePresignedUploadUrl } = require('../services/r2Service');
const { v4: uuidv4 } = require('uuid');

// GET /users/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const quota = await getQuotaInfo(user);
    return res.json({ user, quota });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /users/me — name is always editable; academic fields editable until the
// account is verified (after which they're locked to what the admin approved).
const updateMe = async (req, res) => {
  try {
    const { name, university, sectionName, batch, studentId } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (typeof name === 'string' && name.trim()) user.name = name.trim();

    if (user.verification?.status !== 'verified') {
      if (university !== undefined) user.university = university;
      if (sectionName !== undefined) user.sectionName = sectionName;
      if (batch !== undefined) user.batch = batch;
      if (studentId !== undefined) user.studentId = studentId;
    }

    await user.save();
    return res.json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /users/me/avatar/presign
const presignAvatarUpload = async (req, res) => {
  try {
    const { mimeType } = req.body;
    if (!mimeType) return res.status(400).json({ message: 'mimeType is required' });

    const ext = mimeType.split('/')[1] || 'jpg';
    const fileKey = `avatars/${req.user._id}/${uuidv4()}.${ext}`;

    const presignedUrl = await generatePresignedUploadUrl(fileKey, mimeType);
    return res.json({ fileKey, presignedUrl });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /users/me/avatar/confirm
const confirmAvatarUpload = async (req, res) => {
  try {
    const { fileKey } = req.body;
    if (!fileKey) return res.status(400).json({ message: 'fileKey is required' });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePicKey: fileKey },
      { new: true }
    );
    return res.json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─── Verification ───────────────────────────────────────────────────────────

// POST /users/me/verification/presign  { target: 'idCard'|'nid', mimeType }
// Returns a presigned PUT URL for the ID document. The key is recorded only when
// the user submits (below), so an abandoned upload never changes state.
const presignVerificationDoc = async (req, res) => {
  try {
    const { target, mimeType } = req.body;
    if (!['idCard', 'nid'].includes(target)) {
      return res.status(400).json({ message: "target must be 'idCard' or 'nid'" });
    }
    if (!mimeType) return res.status(400).json({ message: 'mimeType is required' });

    const ext = (mimeType.split('/')[1] || 'jpg').split('+')[0];
    const fileKey = `verifications/users/${req.user._id}/${target}-${uuidv4()}.${ext}`;
    const presignedUrl = await generatePresignedUploadUrl(fileKey, mimeType);
    return res.json({ fileKey, presignedUrl });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /users/me/verification/submit
// Students must supply idCard + academic profile (university, section, batch, id).
// Teachers must supply idCard only. NID is optional for both.
const submitVerification = async (req, res) => {
  try {
    const { idCardKey, nidKey, university, sectionName, batch, studentId } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Admins do not require verification' });
    }
    if (user.verification?.status === 'verified') {
      return res.status(400).json({ message: 'Your account is already verified' });
    }
    if (!idCardKey) {
      return res.status(400).json({ message: 'An ID card image is required' });
    }

    if (user.role === 'student') {
      const missing = ['university', 'sectionName', 'batch', 'studentId'].filter((f) => !req.body[f]);
      if (missing.length) {
        return res.status(400).json({ message: `Missing required student fields: ${missing.join(', ')}` });
      }
      user.university = university;
      user.sectionName = sectionName;
      user.batch = batch;
      user.studentId = studentId;
    }

    user.verification = {
      status: 'pending',
      idCardKey,
      nidKey: nidKey || null,
      submittedAt: new Date(),
      reviewedAt: null,
      reviewedBy: null,
      rejectionReason: null,
    };
    // Submitting a request takes the account off the deletion clock.
    user.deletionDueAt = null;

    await user.save();
    return res.json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /users/search?q= (used by admins/CRs to find people)
const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const regex = new RegExp(q, 'i');
    const users = await User.find({
      $or: [{ email: regex }, { phone: regex }],
    }).select('name email phone role profilePicKey');

    return res.json(users);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getMe,
  updateMe,
  presignAvatarUpload,
  confirmAvatarUpload,
  presignVerificationDoc,
  submitVerification,
  searchUsers,
};
