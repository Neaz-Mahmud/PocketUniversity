const Notice = require('../models/Notice');
const SectionMembership = require('../models/SectionMembership');
const Section = require('../models/Section');
const Notification = require('../models/Notification');

// POST /sections/:id/notices (admin only)
const createNotice = async (req, res) => {
  try {
    const { title, description, type, occurrenceDate, mentionedTeachers } = req.body;
    if (!title || !type) {
      return res.status(400).json({ message: 'title and type are required' });
    }

    // Validate mentionedTeachers are active teacher members of this section
    if (mentionedTeachers && mentionedTeachers.length > 0) {
      const activeMemberships = await SectionMembership.find({
        user: { $in: mentionedTeachers },
        section: req.params.id,
        role: 'teacher',
        status: 'active',
      });
      if (activeMemberships.length !== mentionedTeachers.length) {
        return res.status(400).json({
          message: 'Some mentioned teachers are not active teacher members of this section',
        });
      }
    }

    const notice = await Notice.create({
      section: req.params.id,
      title,
      description: description || '',
      type,
      occurrenceDate: occurrenceDate || null,
      mentionedTeachers: mentionedTeachers || [],
      postedBy: req.user._id,
    });

    const populated = await notice.populate([
      { path: 'postedBy', select: 'name' },
      { path: 'mentionedTeachers', select: 'name email' },
    ]);

    const activeMembers = await SectionMembership.find({ section: req.params.id, status: 'active' });
    const section = await Section.findById(req.params.id);
    const notifications = activeMembers.map(member => ({
      user: member.user,
      section: req.params.id,
      type: 'notice_posted',
      message: `A new notice "${title}" has been posted in "${section.name}".`,
    }));
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    return res.status(201).json(populated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /sections/:id/notices (active members)
const getNotices = async (req, res) => {
  try {
    const { from, to, type, page = 1, limit = 20 } = req.query;
    const query = { section: req.params.id };

    if (from || to) {
      query.occurrenceDate = {};
      if (from) query.occurrenceDate.$gte = new Date(from);
      if (to) query.occurrenceDate.$lte = new Date(to);
    }
    if (type) query.type = type;

    const skip = (Number(page) - 1) * Number(limit);
    const [notices, total] = await Promise.all([
      Notice.find(query)
        .populate('postedBy', 'name')
        .populate('mentionedTeachers', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Notice.countDocuments(query),
    ]);

    return res.json({ notices, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /sections/:id/notices/calendar (active members) — returns dates with notice counts for red-marking
const getCalendar = async (req, res) => {
  try {
    const { month, year } = req.query;
    const now = new Date();
    const y = parseInt(year) || now.getFullYear();
    const m = parseInt(month) || now.getMonth() + 1;

    const startOfMonth = new Date(y, m - 1, 1);
    const endOfMonth = new Date(y, m, 0, 23, 59, 59);

    const results = await Notice.aggregate([
      {
        $match: {
          section: require('mongoose').Types.ObjectId.createFromHexString
            ? require('mongoose').Types.ObjectId.createFromHexString(req.params.id)
            : new (require('mongoose').Types.ObjectId)(req.params.id),
          occurrenceDate: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$occurrenceDate' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const calendar = results.map((r) => ({ date: r._id, count: r.count }));
    return res.json(calendar);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /sections/:id/notices/date/:date (active members)
const getNoticesByDate = async (req, res) => {
  try {
    const date = new Date(req.params.date);
    if (isNaN(date)) return res.status(400).json({ message: 'Invalid date format' });

    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const notices = await Notice.find({
      section: req.params.id,
      occurrenceDate: { $gte: start, $lte: end },
    })
      .populate('postedBy', 'name')
      .populate('mentionedTeachers', 'name email')
      .sort({ createdAt: -1 });

    return res.json(notices);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /sections/:id/notices/:nId (admin only)
const updateNotice = async (req, res) => {
  try {
    const { title, description, type, occurrenceDate, mentionedTeachers } = req.body;
    const notice = await Notice.findOneAndUpdate(
      { _id: req.params.nId, section: req.params.id },
      {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(type && { type }),
        ...(occurrenceDate !== undefined && { occurrenceDate }),
        ...(mentionedTeachers !== undefined && { mentionedTeachers }),
      },
      { new: true, runValidators: true }
    )
      .populate('postedBy', 'name')
      .populate('mentionedTeachers', 'name email');

    if (!notice) return res.status(404).json({ message: 'Notice not found' });
    return res.json(notice);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /sections/:id/notices/:nId (admin only)
const deleteNotice = async (req, res) => {
  try {
    const notice = await Notice.findOneAndDelete({ _id: req.params.nId, section: req.params.id });
    if (!notice) return res.status(404).json({ message: 'Notice not found' });
    return res.json({ message: 'Notice deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /notices/mine — Teacher-specific: notices where this user is in mentionedTeachers
const getMyNotices = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [notices, total] = await Promise.all([
      Notice.find({ mentionedTeachers: req.user._id })
        .populate('section', 'name')
        .populate('postedBy', 'name')
        .populate('mentionedTeachers', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Notice.countDocuments({ mentionedTeachers: req.user._id }),
    ]);

    return res.json({ notices, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /notices/mine/calendar — Teacher calendar: future dates where this teacher is mentioned
const getMyCalendar = async (req, res) => {
  try {
    const { month, year } = req.query;
    const now = new Date();
    const y = parseInt(year) || now.getFullYear();
    const m = parseInt(month) || now.getMonth() + 1;

    const startOfMonth = new Date(y, m - 1, 1);
    const endOfMonth = new Date(y, m, 0, 23, 59, 59);
    const fromDate = startOfMonth > now ? startOfMonth : now; // only future dates

    const mongoose = require('mongoose');
    const results = await Notice.aggregate([
      {
        $match: {
          mentionedTeachers: mongoose.Types.ObjectId.createFromHexString
            ? mongoose.Types.ObjectId.createFromHexString(req.user._id.toString())
            : new mongoose.Types.ObjectId(req.user._id),
          occurrenceDate: { $gte: fromDate, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$occurrenceDate' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return res.json(results.map((r) => ({ date: r._id, count: r.count })));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createNotice,
  getNotices,
  getCalendar,
  getNoticesByDate,
  updateNotice,
  deleteNotice,
  getMyNotices,
  getMyCalendar,
};
