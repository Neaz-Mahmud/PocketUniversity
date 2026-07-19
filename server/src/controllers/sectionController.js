const Section = require('../models/Section');
const SectionMembership = require('../models/SectionMembership');
const User = require('../models/User');
const Notification = require('../models/Notification');

// POST /sections — Create a new section
const createSection = async (req, res) => {
  try {
    const { name, uniqueId, contactPhone } = req.body;
    if (!name || !uniqueId || !contactPhone) {
      return res.status(400).json({ message: 'name, uniqueId, and contactPhone are required' });
    }

    // Teachers are not allowed to create sections.
    if (req.user.role === 'teacher') {
      return res.status(403).json({ message: 'Teachers cannot create sections' });
    }

    // Students (CRs) may only admin one section at a time.
    if (req.user.role === 'student') {
      const existingAdminRole = await SectionMembership.findOne({
        user: req.user._id,
        role: 'admin',
        status: { $in: ['active', 'pending'] }
      });
      if (existingAdminRole) {
        return res.status(403).json({ message: 'You can only be an admin of one section at a time.' });
      }
    }

    const formattedId = uniqueId.trim().toUpperCase();

    const exists = await Section.findOne({ uniqueId: formattedId });
    if (exists) {
      return res.status(409).json({ message: 'A section with this uniqueId already exists' });
    }

    const section = await Section.create({ name, uniqueId: formattedId, contactPhone });

    // Creator becomes active admin immediately
    await SectionMembership.create({
      user: req.user._id,
      section: section._id,
      role: 'admin',
      status: 'active',
      requestedAt: new Date(),
      decidedAt: new Date(),
      decidedBy: req.user._id,
    });

    return res.status(201).json(section);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'A section with this uniqueId already exists' });
    }
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /sections/lookup?uniqueId=... — Lookup section by join code
const lookupSection = async (req, res) => {
  try {
    const { uniqueId } = req.query;
    if (!uniqueId) return res.status(400).json({ message: 'uniqueId query param required' });

    const section = await Section.findOne({ uniqueId: uniqueId.trim().toUpperCase() });
    if (!section) return res.status(404).json({ message: 'Section not found' });

    return res.json(section);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /sections/validate-id?uniqueId=... — Check if a uniqueId is available
const validateUniqueId = async (req, res) => {
  try {
    const { uniqueId } = req.query;
    if (!uniqueId) return res.status(400).json({ message: 'uniqueId query param required' });

    const exists = await Section.findOne({ uniqueId: uniqueId.trim().toUpperCase() });
    return res.json({ available: !exists });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /sections/:id — Get section detail (active member only)
const getSection = async (req, res) => {
  try {
    const section = await Section.findById(req.params.id);
    if (!section) return res.status(404).json({ message: 'Section not found' });
    return res.json(section);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /sections/my — Get all sections user is an active member of
const getMySections = async (req, res) => {
  try {
    const memberships = await SectionMembership.find({
      user: req.user._id,
      status: { $in: ['active', 'invited'] },
    }).populate('section');

    const sections = memberships.map((m) => ({
      ...m.section.toJSON(),
      memberRole: m.role,
      membershipId: m._id,
      status: m.status,
    }));

    return res.json(sections);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /sections/:id/join-requests — Request to join as student/teacher/admin
const createJoinRequest = async (req, res) => {
  try {
    let { role } = req.body;
    if (!role || !['student', 'teacher', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'role must be student, teacher, or admin' });
    }

    if (req.user.role === 'teacher') {
      role = 'admin'; // A teacher can only be an admin
    } else if (req.user.role === 'student' && role === 'teacher') {
      return res.status(400).json({ message: 'Students cannot join as a teacher' });
    }

    // Same rule as createSection: only students are capped at one admin
    // section. Teachers can request admin on as many sections as they need.
    if (role === 'admin' && req.user.role === 'student') {
      const existingAdminRole = await SectionMembership.findOne({
        user: req.user._id,
        role: 'admin',
        status: { $in: ['active', 'pending'] }
      });
      if (existingAdminRole) {
        return res.status(403).json({ message: 'You can only be an admin of one section at a time.' });
      }
    }

    const section = await Section.findById(req.params.id);
    if (!section) return res.status(404).json({ message: 'Section not found' });

    // Check for existing active or pending membership
    const existing = await SectionMembership.findOne({
      user: req.user._id,
      section: req.params.id,
      status: { $in: ['active', 'pending'] },
    });
    if (existing) {
      return res.status(409).json({
        message: existing.status === 'active'
          ? `You are already an active member of this section`
          : `You already have a pending request for this section`,
      });
    }

    const request = await SectionMembership.create({
      user: req.user._id,
      section: req.params.id,
      role,
      status: 'pending',
    });

    const admins = await SectionMembership.find({ section: req.params.id, role: 'admin', status: 'active' });
    const notifications = admins.map(admin => ({
      user: admin.user,
      section: req.params.id,
      type: 'join_request',
      message: `${req.user.name} requested to join as a ${role}.`,
    }));
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    return res.status(201).json(request);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Membership request already exists' });
    }
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /sections/:id/join-requests — List pending requests (admin only)
const getJoinRequests = async (req, res) => {
  try {
    const requests = await SectionMembership.find({
      section: req.params.id,
      status: 'pending',
    }).populate('user', 'name email phone role profilePicKey');

    return res.json(requests);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /sections/:id/join-requests/:reqId — Approve or reject (admin only)
const decideJoinRequest = async (req, res) => {
  try {
    const { decision } = req.body; // 'approve' | 'reject'
    if (!['approve', 'reject'].includes(decision)) {
      return res.status(400).json({ message: 'decision must be approve or reject' });
    }

    const membership = await SectionMembership.findOne({
      _id: req.params.reqId,
      section: req.params.id,
      status: 'pending',
    });

    if (!membership) return res.status(404).json({ message: 'Pending request not found' });

    membership.status = decision === 'approve' ? 'active' : 'removed';
    membership.decidedAt = new Date();
    membership.decidedBy = req.user._id;
    await membership.save();

    if (decision === 'approve') {
      const section = await Section.findById(req.params.id);
      await Notification.create({
        user: membership.user,
        section: req.params.id,
        type: 'request_accepted',
        message: `Your request to join "${section.name}" has been accepted.`,
      });
    }

    return res.json(membership);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /sections/:id/members — List active and invited members (admin only)
const getMembers = async (req, res) => {
  try {
    const { role } = req.query;
    const query = { section: req.params.id, status: { $in: ['active', 'invited'] } };
    if (role && ['student', 'teacher', 'admin'].includes(role)) query.role = role;

    const members = await SectionMembership.find(query)
      .populate('user', 'name email phone role profilePicKey')
      .sort({ status: 1, role: 1, createdAt: 1 });

    // Count by role — always across the whole section, independent of the
    // `role` filter above (so the UI can show e.g. "3 admins, 40 students,
    // 2 teachers" even while the list itself is filtered to one role).
    const mongoose = require('mongoose');
    const counts = await SectionMembership.aggregate([
      { $match: { section: new mongoose.Types.ObjectId(req.params.id), status: 'active' } },
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);

    return res.json({ members, counts });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /sections/:id/members/:userId — Remove member (admin or self)
const removeMember = async (req, res) => {
  try {
    const { userId } = req.params;
    const isSelf = req.user._id.toString() === userId;

    if (!isSelf) {
      // Must be admin to remove others
      const adminCheck = await SectionMembership.findOne({
        user: req.user._id,
        section: req.params.id,
        role: 'admin',
        status: 'active',
      });
      if (!adminCheck) {
        return res.status(403).json({ message: 'Only admins can remove other members' });
      }
    }

    const updated = await SectionMembership.updateMany(
      { user: userId, section: req.params.id, status: { $in: ['active', 'invited'] } },
      { status: 'removed', decidedAt: new Date(), decidedBy: req.user._id }
    );

    if (updated.matchedCount === 0) {
      return res.status(404).json({ message: 'Membership not found or already removed' });
    }

    if (!isSelf) {
      const section = await Section.findById(req.params.id);
      await Notification.create({
        user: userId,
        section: req.params.id,
        type: 'removed_from_section',
        message: `You were removed from "${section.name}".`,
      });
    }

    return res.json({ message: 'Member removed' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /sections/:id/invite — Admin invites user by email or phone
const inviteMember = async (req, res) => {
  try {
    const { email, phone, role } = req.body;
    if (!email && !phone) {
      return res.status(400).json({ message: 'email or phone is required' });
    }
    if (!role || !['student', 'teacher', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'role must be student, teacher, or admin' });
    }

    const query = email ? { email: email.toLowerCase() } : { phone };
    const targetUser = await User.findOne(query);
    if (!targetUser) {
      return res.status(404).json({ message: 'No account found with that email or phone' });
    }

    let roleToAssign = role;
    if (targetUser.role === 'teacher') {
      if (role !== 'teacher' && role !== 'admin') {
        return res.status(400).json({ message: `Cannot invite a teacher as a ${role}` });
      }
      roleToAssign = 'admin'; // Teachers can only be admin
    } else if (targetUser.role === 'student') {
      if (role === 'teacher') {
        return res.status(400).json({ message: `Cannot invite a student as a teacher` });
      }
      roleToAssign = role; // student or admin
    }

    // Check for existing membership
    const existing = await SectionMembership.findOne({
      user: targetUser._id,
      section: req.params.id,
      status: { $in: ['active', 'pending', 'invited'] },
    });
    if (existing) {
      return res.status(409).json({
        message: `User already has an ${existing.status} membership in this section`,
      });
    }

    const membership = await SectionMembership.create({
      user: targetUser._id,
      section: req.params.id,
      role: roleToAssign,
      status: 'invited',
      decidedAt: new Date(),
      decidedBy: req.user._id,
    });
    
    const section = await Section.findById(req.params.id);
    await Notification.create({
      user: targetUser._id,
      section: req.params.id,
      type: 'invited_to_section',
      message: `You have been invited to join "${section.name}" as a ${roleToAssign}.`,
    });

    return res.status(201).json({ message: 'Invite sent', membership, targetUser: { name: targetUser.name, email: targetUser.email } });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Membership request already exists' });
    }
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /sections/:id — Update section (admin only)
const updateSection = async (req, res) => {
  try {
    const { name, uniqueId } = req.body;
    
    // Check if user is admin
    const isAdmin = await SectionMembership.findOne({
      user: req.user._id,
      section: req.params.id,
      role: 'admin',
      status: 'active',
    });
    if (!isAdmin) {
      return res.status(403).json({ message: 'Only admins can update the section' });
    }

    const updates = {};
    if (name) updates.name = name;
    if (uniqueId) {
      updates.uniqueId = uniqueId.trim().toUpperCase();
      // Check if uniqueId already taken by another section
      const existing = await Section.findOne({ uniqueId: updates.uniqueId, _id: { $ne: req.params.id } });
      if (existing) {
        return res.status(409).json({ message: 'A section with this uniqueId already exists' });
      }
    }

    const section = await Section.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!section) return res.status(404).json({ message: 'Section not found' });
    
    return res.json(section);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'A section with this uniqueId already exists' });
    }
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /sections/:id/invitations/decide — User accepts or rejects invite
const decideInvitation = async (req, res) => {
  try {
    const { decision } = req.body;
    if (!['accept', 'reject'].includes(decision)) {
      return res.status(400).json({ message: 'decision must be accept or reject' });
    }

    const membership = await SectionMembership.findOne({
      user: req.user._id,
      section: req.params.id,
      status: 'invited',
    });

    if (!membership) return res.status(404).json({ message: 'Invitation not found' });

    membership.status = decision === 'accept' ? 'active' : 'removed';
    membership.decidedAt = new Date();
    membership.decidedBy = req.user._id;
    await membership.save();

    return res.json(membership);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createSection,
  lookupSection,
  validateUniqueId,
  getSection,
  getMySections,
  createJoinRequest,
  getJoinRequests,
  decideJoinRequest,
  getMembers,
  removeMember,
  inviteMember,
  updateSection,
  decideInvitation,
};
