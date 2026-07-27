const User = require('../models/User');
const Section = require('../models/Section');
const { generatePresignedDownloadUrl } = require('../services/r2Service');
const { deleteUserCascade, deleteSectionCascade } = require('../services/accountCleanup');

// GET /admin/dashboard — headline counts for the admin home.
const getDashboard = async (req, res) => {
  try {
    const [
      pendingUserVerifications,
      pendingSectionVerifications,
      totalStudents,
      totalTeachers,
      totalSections,
    ] = await Promise.all([
      User.countDocuments({ 'verification.status': 'pending' }),
      Section.countDocuments({ 'verification.status': 'pending' }),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'teacher' }),
      Section.countDocuments({}),
    ]);

    return res.json({
      pendingUserVerifications,
      pendingSectionVerifications,
      totalStudents,
      totalTeachers,
      totalSections,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /admin/verifications/users?status=pending
// Returns users with signed URLs for their submitted ID documents so the admin
// can view them in the panel.
const listUserVerifications = async (req, res) => {
  try {
    const status = req.query.status || 'pending';
    const users = await User.find({ role: { $in: ['student', 'teacher'] }, 'verification.status': status })
      .sort({ 'verification.submittedAt': -1 })
      .lean();

    const withUrls = await Promise.all(
      users.map(async (u) => {
        const idCardUrl = u.verification?.idCardKey
          ? await generatePresignedDownloadUrl(u.verification.idCardKey)
          : null;
        const nidUrl = u.verification?.nidKey
          ? await generatePresignedDownloadUrl(u.verification.nidKey)
          : null;
        return { ...u, verificationDocs: { idCardUrl, nidUrl } };
      })
    );

    return res.json(withUrls);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /admin/verifications/users/:id/approve
const approveUserVerification = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.verification?.status !== 'pending') {
      return res.status(400).json({ message: 'No pending verification for this user' });
    }

    user.verification.status = 'verified';
    user.verification.reviewedAt = new Date();
    user.verification.reviewedBy = req.user._id;
    user.verification.rejectionReason = null;
    user.deletionDueAt = null;
    await user.save();

    return res.json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /admin/verifications/users/:id/reject  { reason }
// Marks the request rejected and re-arms a fresh 7-day clock so the user can
// resubmit a corrected document before the account is cleaned up.
const rejectUserVerification = async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.verification?.status !== 'pending') {
      return res.status(400).json({ message: 'No pending verification for this user' });
    }

    user.verification.status = 'rejected';
    user.verification.reviewedAt = new Date();
    user.verification.reviewedBy = req.user._id;
    user.verification.rejectionReason = reason || 'Document could not be verified';
    user.deletionDueAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await user.save();

    return res.json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /admin/verifications/sections?status=pending
const listSectionVerifications = async (req, res) => {
  try {
    const status = req.query.status || 'pending';
    const sections = await Section.find({ 'verification.status': status })
      .sort({ 'verification.submittedAt': -1 })
      .populate('verification.submittedBy', 'name email phone')
      .lean();

    const withUrls = await Promise.all(
      sections.map(async (s) => {
        const idCardUrl = s.verification?.idCardKey
          ? await generatePresignedDownloadUrl(s.verification.idCardKey)
          : null;
        return { ...s, verificationDocs: { idCardUrl } };
      })
    );

    return res.json(withUrls);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /admin/verifications/sections/:id/approve
const approveSectionVerification = async (req, res) => {
  try {
    const section = await Section.findById(req.params.id);
    if (!section) return res.status(404).json({ message: 'Section not found' });
    if (section.verification?.status !== 'pending') {
      return res.status(400).json({ message: 'No pending verification for this section' });
    }

    section.verification.status = 'verified';
    section.verification.reviewedAt = new Date();
    section.verification.reviewedBy = req.user._id;
    section.verification.rejectionReason = null;
    section.deletionDueAt = null;
    await section.save();

    return res.json(section);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /admin/verifications/sections/:id/reject  { reason }
const rejectSectionVerification = async (req, res) => {
  try {
    const { reason } = req.body;
    const section = await Section.findById(req.params.id);
    if (!section) return res.status(404).json({ message: 'Section not found' });
    if (section.verification?.status !== 'pending') {
      return res.status(400).json({ message: 'No pending verification for this section' });
    }

    section.verification.status = 'rejected';
    section.verification.reviewedAt = new Date();
    section.verification.reviewedBy = req.user._id;
    section.verification.rejectionReason = reason || 'Document could not be verified';
    section.deletionDueAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await section.save();

    return res.json(section);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /admin/users?q=&role=&page=
const listUsers = async (req, res) => {
  try {
    const { q, role } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = 25;

    const filter = {};
    if (role && ['student', 'teacher', 'admin'].includes(role)) filter.role = role;
    if (q) {
      const regex = new RegExp(q.trim(), 'i');
      filter.$or = [{ name: regex }, { email: regex }, { phone: regex }];
    }

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      User.countDocuments(filter),
    ]);

    return res.json({ users, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /admin/users/:id — cascade delete a user and everything they own.
const deleteUser = async (req, res) => {
  try {
    if (req.params.id === String(req.user._id)) {
      return res.status(400).json({ message: 'You cannot delete your own admin account' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await deleteUserCascade(user._id);
    return res.json({ message: 'User deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /admin/sections?q=&page=
const listSections = async (req, res) => {
  try {
    const { q } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = 25;

    const filter = {};
    if (q) {
      const regex = new RegExp(q.trim(), 'i');
      filter.$or = [{ name: regex }, { uniqueId: regex }];
    }

    const [sections, total] = await Promise.all([
      Section.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Section.countDocuments(filter),
    ]);

    return res.json({ sections, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /admin/sections/:id — cascade delete a section and its content.
const deleteSection = async (req, res) => {
  try {
    const section = await Section.findById(req.params.id);
    if (!section) return res.status(404).json({ message: 'Section not found' });

    await deleteSectionCascade(section._id);
    return res.json({ message: 'Section deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /admin/admins  { email } — promote an existing user to platform admin.
const grantAdmin = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'email is required' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(404).json({ message: 'No user with that email' });
    if (user.role === 'admin') return res.status(400).json({ message: 'User is already an admin' });

    user.role = 'admin';
    user.deletionDueAt = null;
    user.verification.status = 'verified';
    await user.save();

    return res.json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
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
};
