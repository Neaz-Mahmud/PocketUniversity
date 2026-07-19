const SectionMembership = require('../models/SectionMembership');

/**
 * Middleware: attach the user's active membership for req.params.id section.
 * If role is specified, also checks that role matches.
 */
const requireActiveMember = (role = null) => async (req, res, next) => {
  try {
    const query = {
      user: req.user._id,
      section: req.params.id,
      status: 'active',
    };
    if (role) query.role = role;

    const membership = await SectionMembership.findOne(query);
    if (!membership) {
      return res.status(403).json({
        message: role
          ? `You must be an active ${role} of this section`
          : 'You must be an active member of this section',
      });
    }

    req.membership = membership;
    next();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Middleware: check user is an active admin of the section.
 * Shortcut for requireActiveMember('admin').
 */
const requireAdmin = requireActiveMember('admin');

/**
 * Helper: is user an active admin of sectionId?
 */
const isAdmin = async (userId, sectionId) => {
  const m = await SectionMembership.findOne({
    user: userId,
    section: sectionId,
    role: 'admin',
    status: 'active',
  });
  return !!m;
};

/**
 * Helper: is user an active member (any role) of sectionId?
 */
const isMember = async (userId, sectionId) => {
  const m = await SectionMembership.findOne({
    user: userId,
    section: sectionId,
    status: 'active',
  });
  return !!m;
};

module.exports = { requireActiveMember, requireAdmin, isAdmin, isMember };
