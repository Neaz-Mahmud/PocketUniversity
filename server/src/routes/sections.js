const express = require('express');
const rateLimit = require('express-rate-limit');
const { protect } = require('../middleware/auth');
const { requireAdmin, requireActiveMember } = require('../middleware/sectionGuard');
const {
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
} = require('../controllers/sectionController');

const router = express.Router();

const lookupLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // Limit each IP to 20 requests per windowMs
  message: { message: 'Too many lookup requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(protect);

// General section routes
router.post('/', createSection);
router.get('/my', getMySections);
router.get('/lookup', lookupLimiter, lookupSection);
router.get('/validate-id', validateUniqueId);
router.get('/:id', requireActiveMember(), getSection);
router.patch('/:id', requireAdmin, updateSection);

// Join requests
router.post('/:id/join-requests', createJoinRequest);
router.get('/:id/join-requests', requireAdmin, getJoinRequests);
router.patch('/:id/join-requests/:reqId', requireAdmin, decideJoinRequest);

// Members
router.get('/:id/members', requireAdmin, getMembers);
router.delete('/:id/members/:userId', removeMember);

// Invite
router.post('/:id/invite', requireAdmin, inviteMember);
router.patch('/:id/invitations/decide', decideInvitation);

module.exports = router;
