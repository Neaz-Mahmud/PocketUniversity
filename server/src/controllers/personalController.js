const { v4: uuidv4 } = require('uuid');
const PersonalFolder = require('../models/PersonalFolder');
const PersonalFile = require('../models/PersonalFile');
const { generatePresignedUploadUrl, generatePresignedDownloadUrl, deleteObject } = require('../services/r2Service');
const { checkQuota, getQuotaInfo } = require('../services/quotaService');

// ─── Folders ─────────────────────────────────────────────────────────────────

// GET /personal/folders
const getFolders = async (req, res) => {
  try {
    const { parent } = req.query;
    const query = {
      owner: req.user._id,
      parentFolder: parent || null,
    };
    const folders = await PersonalFolder.find(query).sort({ name: 1 });
    return res.json(folders);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /personal/folders
const createFolder = async (req, res) => {
  try {
    const { type, name, parentFolder } = req.body;

    if (!type || !name) {
      return res.status(400).json({ message: 'type and name are required' });
    }
    if (!['semester', 'course'].includes(type)) {
      return res.status(400).json({ message: 'type must be semester or course' });
    }
    if (type === 'course' && !parentFolder) {
      return res.status(400).json({ message: 'Course folders require a parentFolder (semester)' });
    }
    if (type === 'semester' && parentFolder) {
      return res.status(400).json({ message: 'Semester folders cannot have a parent' });
    }

    // Validate parent exists and belongs to user
    if (parentFolder) {
      const parent = await PersonalFolder.findOne({ _id: parentFolder, owner: req.user._id });
      if (!parent || parent.type !== 'semester') {
        return res.status(400).json({ message: 'Invalid parent folder' });
      }
    }

    const folder = await PersonalFolder.create({
      owner: req.user._id,
      type,
      name,
      parentFolder: parentFolder || null,
    });

    return res.status(201).json(folder);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'A folder with this name already exists here' });
    }
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /personal/folders/:id
const renameFolder = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'name is required' });

    const folder = await PersonalFolder.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { name },
      { new: true, runValidators: true }
    );

    if (!folder) return res.status(404).json({ message: 'Folder not found' });
    return res.json(folder);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'A folder with this name already exists here' });
    }
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /personal/folders/:id
const deleteFolder = async (req, res) => {
  try {
    const folder = await PersonalFolder.findOne({ _id: req.params.id, owner: req.user._id });
    if (!folder) return res.status(404).json({ message: 'Folder not found' });

    // Collect all descendant folder IDs
    const allFolderIds = await collectDescendantIds(folder._id, req.user._id);
    allFolderIds.push(folder._id);

    // Delete all files inside these folders from R2 + DB
    const files = await PersonalFile.find({ owner: req.user._id, folder: { $in: allFolderIds } });
    for (const f of files) {
      try { await deleteObject(f.fileKey); } catch (_) { /* ignore R2 errors */ }
    }
    await PersonalFile.deleteMany({ owner: req.user._id, folder: { $in: allFolderIds } });

    // Delete all folders
    await PersonalFolder.deleteMany({ _id: { $in: allFolderIds } });

    return res.json({ message: 'Folder deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const collectDescendantIds = async (parentId, ownerId) => {
  const children = await PersonalFolder.find({ parentFolder: parentId, owner: ownerId }, '_id');
  const ids = children.map((c) => c._id);
  for (const id of [...ids]) {
    const nested = await collectDescendantIds(id, ownerId);
    ids.push(...nested);
  }
  return ids;
};

// ─── Files ────────────────────────────────────────────────────────────────────

// GET /personal/files?folder=<id>
const getFiles = async (req, res) => {
  try {
    const { folder } = req.query;
    if (!folder) return res.status(400).json({ message: 'folder query param required' });

    const folderDoc = await PersonalFolder.findOne({ _id: folder, owner: req.user._id });
    if (!folderDoc) return res.status(404).json({ message: 'Folder not found' });

    const files = await PersonalFile.find({ owner: req.user._id, folder, status: 'active' }).sort({
      createdAt: -1,
    });

    // Attach presigned download URLs
    const filesWithUrls = await Promise.all(
      files.map(async (f) => {
        const downloadUrl = await generatePresignedDownloadUrl(f.fileKey);
        return { ...f.toJSON(), downloadUrl };
      })
    );

    return res.json(filesWithUrls);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /personal/files/presign
const presignUpload = async (req, res) => {
  try {
    const { folderId, fileName, fileSize, mimeType } = req.body;
    if (!folderId || !fileName || !fileSize || !mimeType) {
      return res.status(400).json({ message: 'folderId, fileName, fileSize, mimeType are required' });
    }

    // Validate folder ownership
    const folder = await PersonalFolder.findOne({ _id: folderId, owner: req.user._id, type: 'course' });
    if (!folder) return res.status(404).json({ message: 'Course folder not found' });

    // Check quota before issuing presigned URL
    await checkQuota(req.user._id, fileSize, req.user.role);

    // Create pending file record
    const fileId = uuidv4();
    const fileKey = `personal/${req.user._id}/${folderId}/${fileId}-${fileName}`;

    const file = await PersonalFile.create({
      owner: req.user._id,
      folder: folderId,
      fileName,
      fileKey,
      fileSize,
      mimeType,
      status: 'pending',
    });

    const presignedUrl = await generatePresignedUploadUrl(fileKey, mimeType);

    return res.status(201).json({ fileId: file._id, fileKey, presignedUrl });
  } catch (err) {
    if (err.code === 'QUOTA_EXCEEDED' || err.status === 413) {
      return res.status(413).json({ message: err.message, code: 'QUOTA_EXCEEDED' });
    }
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /personal/files/confirm
const confirmUpload = async (req, res) => {
  try {
    const { fileId } = req.body;
    if (!fileId) return res.status(400).json({ message: 'fileId is required' });

    const file = await PersonalFile.findOneAndUpdate(
      { _id: fileId, owner: req.user._id, status: 'pending' },
      { status: 'active' },
      { new: true }
    );

    if (!file) return res.status(404).json({ message: 'Pending file not found' });
    return res.json(file);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /personal/files/:id
const deleteFile = async (req, res) => {
  try {
    const file = await PersonalFile.findOne({ _id: req.params.id, owner: req.user._id });
    if (!file) return res.status(404).json({ message: 'File not found' });

    try { await deleteObject(file.fileKey); } catch (_) { /* continue even if R2 fails */ }
    await file.deleteOne();

    return res.json({ message: 'File deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /personal/files/:id
const renameFile = async (req, res) => {
  try {
    const { fileName } = req.body;
    if (!fileName) return res.status(400).json({ message: 'fileName is required' });

    const file = await PersonalFile.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id, status: 'active' },
      { fileName },
      { new: true, runValidators: true }
    );

    if (!file) return res.status(404).json({ message: 'File not found' });
    
    // Attach fresh presigned download URL
    const downloadUrl = await generatePresignedDownloadUrl(file.fileKey);
    return res.json({ ...file.toJSON(), downloadUrl });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /personal/quota
const getQuota = async (req, res) => {
  try {
    const info = await getQuotaInfo(req.user._id, req.user.role);
    return res.json(info);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
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
};
