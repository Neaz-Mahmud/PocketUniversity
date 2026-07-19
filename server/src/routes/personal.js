const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getFolders,
  createFolder,
  renameFolder,
  deleteFolder,
  getFiles,
  presignUpload,
  confirmUpload,
  renameFile,
  deleteFile,
  getQuota,
} = require('../controllers/personalController');

const router = express.Router();

router.use(protect);

router.get('/quota', getQuota);

router.get('/folders', getFolders);
router.post('/folders', createFolder);
router.patch('/folders/:id', renameFolder);
router.delete('/folders/:id', deleteFolder);

router.get('/files', getFiles);
router.post('/files/presign', presignUpload);
router.post('/files/confirm', confirmUpload);
router.patch('/files/:id', renameFile);
router.delete('/files/:id', deleteFile);

module.exports = router;
