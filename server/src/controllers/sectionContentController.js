const { v4: uuidv4 } = require('uuid');
const Semester = require('../models/Semester');
const Course = require('../models/Course');
const Material = require('../models/Material');
const Section = require('../models/Section');
const SectionMembership = require('../models/SectionMembership');
const MirrorLink = require('../models/MirrorLink');
const Notification = require('../models/Notification');
const { generatePresignedUploadUrl, generatePresignedDownloadUrl, deleteObject } = require('../services/r2Service');
const { getSectionLimit } = require('../services/quotaService');

// Helper: verify course belongs to section
const verifyCourseInSection = async (courseId, sectionId) => {
  const course = await Course.findById(courseId).populate('semester');
  if (!course || course.semester.section.toString() !== sectionId) return null;
  return course;
};

// ─── Semesters ────────────────────────────────────────────────────────────────

// GET /sections/:id/semesters
const getSemesters = async (req, res) => {
  try {
    const semesters = await Semester.find({ section: req.params.id }).sort({ order: 1, name: 1 });
    return res.json(semesters);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /sections/:id/semesters (admin only)
const createSemester = async (req, res) => {
  try {
    const { name, order } = req.body;
    if (!name) return res.status(400).json({ message: 'name is required' });

    const semester = await Semester.create({
      section: req.params.id,
      name,
      order: order ?? 0,
    });
    return res.status(201).json(semester);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'A semester with this name already exists in this section' });
    }
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /sections/:id/semesters/:semId (admin only)
const updateSemester = async (req, res) => {
  try {
    const { name, order } = req.body;
    const semester = await Semester.findOneAndUpdate(
      { _id: req.params.semId, section: req.params.id },
      { ...(name && { name }), ...(order !== undefined && { order }) },
      { new: true, runValidators: true }
    );
    if (!semester) return res.status(404).json({ message: 'Semester not found' });
    return res.json(semester);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'A semester with this name already exists' });
    }
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /sections/:id/semesters/:semId (admin only) — cascades to courses & materials
const deleteSemester = async (req, res) => {
  try {
    const semester = await Semester.findOne({ _id: req.params.semId, section: req.params.id });
    if (!semester) return res.status(404).json({ message: 'Semester not found' });

    const courses = await Course.find({ semester: semester._id });
    for (const course of courses) {
      const materials = await Material.find({ course: course._id });
      for (const mat of materials) {
        // Mirrored materials share their R2 object with the teacher's
        // original Share Material file — only delete the object when this
        // section owns it directly (not mirrored).
        if (!mat.mirroredFrom) {
          try { await deleteObject(mat.fileKey); } catch (_) {}
        }
      }
      await Material.deleteMany({ course: course._id });
      await MirrorLink.deleteOne({ targetCourse: course._id });
    }
    await Course.deleteMany({ semester: semester._id });
    await semester.deleteOne();

    return res.json({ message: 'Semester deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─── Courses ──────────────────────────────────────────────────────────────────

// GET /sections/:id/semesters/:semId/courses
const getCourses = async (req, res) => {
  try {
    const semester = await Semester.findOne({ _id: req.params.semId, section: req.params.id });
    if (!semester) return res.status(404).json({ message: 'Semester not found' });

    const courses = await Course.find({ semester: req.params.semId }).sort({ name: 1 });
    return res.json(courses);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /sections/:id/semesters/:semId/courses (admin only)
const createCourse = async (req, res) => {
  try {
    const semester = await Semester.findOne({ _id: req.params.semId, section: req.params.id });
    if (!semester) return res.status(404).json({ message: 'Semester not found' });

    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'name is required' });

    const course = await Course.create({ semester: semester._id, name });
    return res.status(201).json(course);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'A course with this name already exists in this semester' });
    }
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /sections/:id/semesters/:semId/courses/:courseId (admin only)
const updateCourse = async (req, res) => {
  try {
    const { name } = req.body;
    const course = await Course.findOneAndUpdate(
      { _id: req.params.courseId, semester: req.params.semId },
      { name },
      { new: true, runValidators: true }
    );
    if (!course) return res.status(404).json({ message: 'Course not found' });
    return res.json(course);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'A course with this name already exists' });
    }
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /sections/:id/semesters/:semId/courses/:courseId (admin only)
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findOne({ _id: req.params.courseId, semester: req.params.semId });
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const materials = await Material.find({ course: course._id });
    for (const mat of materials) {
      if (!mat.mirroredFrom) {
        try { await deleteObject(mat.fileKey); } catch (_) {}
      }
    }
    await Material.deleteMany({ course: course._id });
    await MirrorLink.deleteOne({ targetCourse: course._id });
    await course.deleteOne();

    return res.json({ message: 'Course deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─── Materials ────────────────────────────────────────────────────────────────

// GET /sections/:id/courses/:courseId/materials
const getMaterials = async (req, res) => {
  try {
    const course = await verifyCourseInSection(req.params.courseId, req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found in this section' });

    const materials = await Material.find({ course: course._id, status: 'active' })
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 });

    const materialsWithUrls = await Promise.all(
      materials.map(async (m) => {
        const downloadUrl = await generatePresignedDownloadUrl(m.fileKey);
        return { ...m.toJSON(), downloadUrl };
      })
    );

    return res.json(materialsWithUrls);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /sections/:id/courses/:courseId/materials/presign (admin only)
const presignMaterialUpload = async (req, res) => {
  try {
    const section = await Section.findById(req.params.id);
    const course = await verifyCourseInSection(req.params.courseId, req.params.id);
    if (!course || !section) return res.status(404).json({ message: 'Course or Section not found in this section' });

    const { fileName, fileSize, mimeType } = req.body;
    if (!fileName || !fileSize || !mimeType) {
      return res.status(400).json({ message: 'fileName, fileSize, mimeType are required' });
    }

    const MAX_STORAGE = getSectionLimit(section);
    if ((section.storageUsed || 0) + fileSize > MAX_STORAGE) {
      const limitLabel = MAX_STORAGE >= 1024 * 1024 * 1024
        ? `${(MAX_STORAGE / (1024 * 1024 * 1024)).toFixed(0)} GB`
        : `${(MAX_STORAGE / (1024 * 1024)).toFixed(0)} MB`;
      return res.status(403).json({
        message: section.verification?.status === 'verified'
          ? `Storage limit of ${limitLabel} reached for this section`
          : `This section has only ${limitLabel} until it is verified. Ask the CR to submit section verification to unlock 3 GB.`,
        code: 'QUOTA_EXCEEDED',
      });
    }

    const fileId = uuidv4();
    const fileKey = `sections/${req.params.id}/${req.params.courseId}/${fileId}-${fileName}`;

    const material = await Material.create({
      course: course._id,
      fileName,
      fileKey,
      fileSize,
      mimeType,
      uploadedBy: req.user._id,
      status: 'pending',
    });

    const presignedUrl = await generatePresignedUploadUrl(fileKey, mimeType);
    return res.status(201).json({ materialId: material._id, fileKey, presignedUrl });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /sections/:id/courses/:courseId/materials/confirm (admin only)
const confirmMaterialUpload = async (req, res) => {
  try {
    const { materialId } = req.body;
    if (!materialId) return res.status(400).json({ message: 'materialId is required' });

    const material = await Material.findOneAndUpdate(
      { _id: materialId, status: 'pending' },
      { status: 'active' },
      { new: true }
    );

    if (!material) return res.status(404).json({ message: 'Pending material not found' });

    // Update section storage
    const section = await Section.findByIdAndUpdate(req.params.id, {
      $inc: { storageUsed: material.fileSize }
    });

    const activeMembers = await SectionMembership.find({ section: req.params.id, status: 'active' });
    const notifications = activeMembers.map(member => ({
      user: member.user,
      section: req.params.id,
      type: 'material_uploaded',
      message: `A new material "${material.fileName}" has been uploaded in "${section.name}".`,
    }));
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    return res.json(material);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /sections/:id/courses/:courseId/materials/:matId (admin only)
const renameMaterial = async (req, res) => {
  try {
    const { fileName } = req.body;
    if (!fileName) return res.status(400).json({ message: 'fileName is required' });

    const course = await verifyCourseInSection(req.params.courseId, req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found in this section' });

    const material = await Material.findOneAndUpdate(
      { _id: req.params.matId, course: course._id, status: 'active' },
      { fileName },
      { new: true, runValidators: true }
    );

    if (!material) return res.status(404).json({ message: 'Material not found' });
    
    // Attach fresh presigned download URL
    const downloadUrl = await generatePresignedDownloadUrl(material.fileKey);
    return res.json({ ...material.toJSON(), downloadUrl });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /sections/:id/courses/:courseId/materials/:matId (admin only)
const deleteMaterial = async (req, res) => {
  try {
    const course = await verifyCourseInSection(req.params.courseId, req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found in this section' });

    const material = await Material.findOne({ _id: req.params.matId, course: course._id });
    if (!material) return res.status(404).json({ message: 'Material not found' });

    // Mirrored materials share their R2 object with the teacher's original
    // Share Material file — only delete the object when this section owns
    // it directly. (If it's still mirror-linked, the teacher's next upload
    // to that course won't re-add this specific file, since it already
    // exists on their side; this only removes the section's copy of it.)
    if (!material.mirroredFrom) {
      try { await deleteObject(material.fileKey); } catch (_) {}
    }
    
    // Update section storage
    await Section.findByIdAndUpdate(req.params.id, {
      $inc: { storageUsed: -material.fileSize }
    });

    await material.deleteOne();

    return res.json({ message: 'Material deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getSemesters,
  createSemester,
  updateSemester,
  deleteSemester,
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  getMaterials,
  presignMaterialUpload,
  confirmMaterialUpload,
  renameMaterial,
  deleteMaterial,
};
