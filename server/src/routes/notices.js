const express = require('express');
const { protect } = require('../middleware/auth');
const { requireAdmin, requireActiveMember } = require('../middleware/sectionGuard');
const {
  createNotice,
  getNotices,
  getCalendar,
  getNoticesByDate,
  updateNotice,
  deleteNotice,
  getMyNotices,
  getMyCalendar,
} = require('../controllers/noticeController');

// We use two routers: one for /sections/:id/notices, one for /notices (teacher specific)
const sectionNoticeRouter = express.Router({ mergeParams: true });
const teacherNoticeRouter = express.Router();

sectionNoticeRouter.use(protect);
teacherNoticeRouter.use(protect);

// Section notices (mounted at /sections/:id/notices)
sectionNoticeRouter.post('/', requireAdmin, createNotice);
sectionNoticeRouter.get('/', requireActiveMember(), getNotices);
sectionNoticeRouter.get('/calendar', requireActiveMember(), getCalendar);
sectionNoticeRouter.get('/date/:date', requireActiveMember(), getNoticesByDate);
sectionNoticeRouter.patch('/:nId', requireAdmin, updateNotice);
sectionNoticeRouter.delete('/:nId', requireAdmin, deleteNotice);

// Teacher specific notices (mounted at /notices)
teacherNoticeRouter.get('/mine', getMyNotices);
teacherNoticeRouter.get('/mine/calendar', getMyCalendar);

module.exports = { sectionNoticeRouter, teacherNoticeRouter };
