const MirrorRequest = require('../models/MirrorRequest');
const MirrorLink = require('../models/MirrorLink');
const TeacherMaterialFolder = require('../models/TeacherMaterialFolder');
const Course = require('../models/Course');
const Semester = require('../models/Semester');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { backfillLink } = require('../services/mirrorService');

// ─── Admin side ────────────────────────────────────────────────────────────

// POST /sections/:id/courses/:courseId/mirror-requests (admin only)
// Body: { phone: string }
const createMirrorRequest = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: 'phone is required' });

    const course = await Course.findOne({ _id: req.params.courseId }).populate('semester');
    if (!course || course.semester.section.toString() !== req.params.id) {
      return res.status(404).json({ message: 'Course not found in this section' });
    }

    const teacher = await User.findOne({ phone: phone.trim(), role: 'teacher' });
    if (!teacher) {
      return res.status(404).json({ message: 'No teacher account found with that phone number' });
    }

    const request = await MirrorRequest.create({
      section: req.params.id,
      targetSemester: course.semester._id,
      targetCourse: course._id,
      requestedTeacher: teacher._id,
      requestedBy: req.user._id,
    });

    const populated = await request.populate([
      { path: 'requestedTeacher', select: 'name phone' },
      { path: 'targetSemester', select: 'name' },
      { path: 'targetCourse', select: 'name' },
    ]);

    return res.status(201).json(populated);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'A request to this teacher for this course is already pending or approved' });
    }
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /sections/:id/courses/:courseId/mirror-requests (admin only)
const getCourseMirrorStatus = async (req, res) => {
  try {
    const requests = await MirrorRequest.find({ targetCourse: req.params.courseId })
      .populate('requestedTeacher', 'name phone')
      .sort({ createdAt: -1 });

    const link = await MirrorLink.findOne({ targetCourse: req.params.courseId }).populate('teacher', 'name phone');

    return res.json({ requests, link });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /sections/:id/courses/:courseId/mirror-requests/:reqId (admin only)
const deleteMirrorRequest = async (req, res) => {
  try {
    const request = await MirrorRequest.findOneAndDelete({
      _id: req.params.reqId,
      targetCourse: req.params.courseId,
    });
    if (!request) return res.status(404).json({ message: 'Request not found' });
    return res.json({ message: 'Request deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /sections/:id/courses/:courseId/mirror-link (admin only) — unlink
const removeMirrorLink = async (req, res) => {
  try {
    const link = await MirrorLink.findOneAndDelete({ targetCourse: req.params.courseId });
    if (!link) return res.status(404).json({ message: 'No active mirror link for this course' });
    // Note: mirrored Material rows are left in place intentionally (they're
    // already-delivered content); only future auto-updates stop.
    return res.json({ message: 'Mirror link removed. Existing mirrored files were kept.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─── Teacher side ──────────────────────────────────────────────────────────

// GET /teacher-materials/mirror-requests — pending requests addressed to me
const getMyMirrorRequests = async (req, res) => {
  try {
    const requests = await MirrorRequest.find({ requestedTeacher: req.user._id, status: 'pending' })
      .populate('section', 'name uniqueId')
      .populate('targetSemester', 'name')
      .populate('targetCourse', 'name')
      .sort({ createdAt: -1 });

    return res.json(requests);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /teacher-materials/mirror-requests/:id/reject
const rejectMirrorRequest = async (req, res) => {
  try {
    const request = await MirrorRequest.findOneAndUpdate(
      { _id: req.params.id, requestedTeacher: req.user._id, status: 'pending' },
      { status: 'rejected', decidedAt: new Date() },
      { new: true }
    ).populate('targetCourse', 'name');
    if (!request) return res.status(404).json({ message: 'Pending request not found' });

    await Notification.create({
      user: request.requestedBy,
      section: request.section,
      type: 'mirror_rejected',
      message: `Your mirror request for "${request.targetCourse.name}" was declined.`,
    });

    return res.json(request);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /teacher-materials/mirror-requests/:id/approve
// Body: { sourceFolderId } — one of the teacher's own Share Material course folders
const approveMirrorRequest = async (req, res) => {
  try {
    const { sourceFolderId } = req.body;
    if (!sourceFolderId) return res.status(400).json({ message: 'sourceFolderId is required' });

    const request = await MirrorRequest.findOne({
      _id: req.params.id,
      requestedTeacher: req.user._id,
      status: 'pending',
    });
    if (!request) return res.status(404).json({ message: 'Pending request not found' });

    const folder = await TeacherMaterialFolder.findOne({
      _id: sourceFolderId,
      owner: req.user._id,
      type: 'course',
    });
    if (!folder) return res.status(404).json({ message: 'Course folder not found' });

    request.status = 'approved';
    request.sourceFolder = folder._id;
    request.decidedAt = new Date();
    await request.save();

    const link = await MirrorLink.create({
      section: request.section,
      targetCourse: request.targetCourse,
      sourceFolder: folder._id,
      teacher: req.user._id,
      mirrorRequest: request._id,
    });

    const createdMaterials = await backfillLink(link);

    return res.json({ request, link, mirroredFileCount: createdMaterials.length });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'That section course already has an active mirror link' });
    }
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /teacher-materials/mirrors/:id — teacher unlinks their folder from a section
const teacherRemoveMirrorLink = async (req, res) => {
  try {
    const link = await MirrorLink.findOneAndDelete({ _id: req.params.id, teacher: req.user._id });
    if (!link) return res.status(404).json({ message: 'Active mirror link not found' });
    // Mirrored Material rows are left in place, as with the admin-side unlink
    return res.json({ message: 'Mirror unlinked successfully.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createMirrorRequest,
  getCourseMirrorStatus,
  removeMirrorLink,
  getMyMirrorRequests,
  rejectMirrorRequest,
  approveMirrorRequest,
  deleteMirrorRequest,
  teacherRemoveMirrorLink,
};
