const express = require('express');
const { protect } = require('../middleware/auth');
const { requireAdmin, requireActiveMember } = require('../middleware/sectionGuard');
const {
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
} = require('../controllers/sectionContentController');
const {
  createMirrorRequest,
  getCourseMirrorStatus,
  removeMirrorLink,
  deleteMirrorRequest,
} = require('../controllers/mirrorController');

const router = express.Router({ mergeParams: true });

router.use(protect);

// Semesters
router.get('/semesters', requireActiveMember(), getSemesters);
router.post('/semesters', requireAdmin, createSemester);
router.patch('/semesters/:semId', requireAdmin, updateSemester);
router.delete('/semesters/:semId', requireAdmin, deleteSemester);

// Courses
router.get('/semesters/:semId/courses', requireActiveMember(), getCourses);
router.post('/semesters/:semId/courses', requireAdmin, createCourse);
router.patch('/semesters/:semId/courses/:courseId', requireAdmin, updateCourse);
router.delete('/semesters/:semId/courses/:courseId', requireAdmin, deleteCourse);

// Materials
router.get('/courses/:courseId/materials', requireActiveMember(), getMaterials);
router.post('/courses/:courseId/materials/presign', requireAdmin, presignMaterialUpload);
router.post('/courses/:courseId/materials/confirm', requireAdmin, confirmMaterialUpload);
router.patch('/courses/:courseId/materials/:matId', requireAdmin, renameMaterial);
router.delete('/courses/:courseId/materials/:matId', requireAdmin, deleteMaterial);

// Mirror requests — admin asks a teacher (by phone) to mirror one of their
// Share Material courses into this section course
router.post('/courses/:courseId/mirror-requests', requireAdmin, createMirrorRequest);
router.get('/courses/:courseId/mirror-requests', requireAdmin, getCourseMirrorStatus);
router.delete('/courses/:courseId/mirror-requests/:reqId', requireAdmin, deleteMirrorRequest);
router.delete('/courses/:courseId/mirror-link', requireAdmin, removeMirrorLink);

module.exports = router;
