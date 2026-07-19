const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getFolders,
  getFolderMirrors,
  createFolder,
  renameFolder,
  deleteFolder,
  getFiles,
  presignUpload,
  confirmUpload,
  renameFile,
  deleteFile,
} = require('../controllers/teacherMaterialController');
const {
  getMyMirrorRequests,
  rejectMirrorRequest,
  approveMirrorRequest,
  teacherRemoveMirrorLink,
} = require('../controllers/mirrorController');

const router = express.Router();

router.use(protect);

// Folders
router.get('/folders', getFolders);
router.get('/folders/:id/mirrors', getFolderMirrors);
router.post('/folders', createFolder);
router.patch('/folders/:id', renameFolder);
router.delete('/folders/:id', deleteFolder);

// Files
router.get('/files', getFiles);
router.post('/files/presign', presignUpload);
router.post('/files/confirm', confirmUpload);
router.patch('/files/:id', renameFile);
router.delete('/files/:id', deleteFile);

// Active Mirrors
router.delete('/mirrors/:id', teacherRemoveMirrorLink);

// Incoming mirror requests (from section admins asking to mirror a course)
router.get('/mirror-requests', getMyMirrorRequests);
router.patch('/mirror-requests/:id/approve', approveMirrorRequest);
router.patch('/mirror-requests/:id/reject', rejectMirrorRequest);

module.exports = router;
