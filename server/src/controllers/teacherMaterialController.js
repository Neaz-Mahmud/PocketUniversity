const { v4: uuidv4 } = require('uuid');
const TeacherMaterialFolder = require('../models/TeacherMaterialFolder');
const TeacherMaterialFile = require('../models/TeacherMaterialFile');
const MirrorLink = require('../models/MirrorLink');
const { generatePresignedUploadUrl, generatePresignedDownloadUrl, deleteObject } = require('../services/r2Service');
const { propagateFileToLinks, removeMirroredCopies, propagateFileRenameToLinks } = require('../services/mirrorService');

// ─── Folders ─────────────────────────────────────────────────────────────────

// GET /teacher-materials/folders?parent=<id|null>
const getFolders = async (req, res) => {
  try {
    const { parent } = req.query;
    const folders = await TeacherMaterialFolder.find({
      owner: req.user._id,
      parentFolder: parent || null,
    }).sort({ name: 1 });
    return res.json(folders);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /teacher-materials/folders/:id/mirrors
const getFolderMirrors = async (req, res) => {
  try {
    const mirrors = await MirrorLink.find({ 
      sourceFolder: req.params.id, 
      teacher: req.user._id 
    })
      .populate('section', 'name')
      .populate('targetCourse', 'name')
      .sort({ createdAt: -1 });
    return res.json(mirrors);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /teacher-materials/folders
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

    if (parentFolder) {
      const parent = await TeacherMaterialFolder.findOne({ _id: parentFolder, owner: req.user._id });
      if (!parent || parent.type !== 'semester') {
        return res.status(400).json({ message: 'Invalid parent folder' });
      }
    }

    const folder = await TeacherMaterialFolder.create({
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

// PATCH /teacher-materials/folders/:id
const renameFolder = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'name is required' });

    const folder = await TeacherMaterialFolder.findOneAndUpdate(
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

// DELETE /teacher-materials/folders/:id — cascades to sub-folders, files, and mirrored copies
const deleteFolder = async (req, res) => {
  try {
    const folder = await TeacherMaterialFolder.findOne({ _id: req.params.id, owner: req.user._id });
    if (!folder) return res.status(404).json({ message: 'Folder not found' });

    const allFolderIds = await collectDescendantIds(folder._id, req.user._id);
    allFolderIds.push(folder._id);

    const files = await TeacherMaterialFile.find({ owner: req.user._id, folder: { $in: allFolderIds } });
    for (const f of files) {
      await removeMirroredCopies(f._id);
      try { await deleteObject(f.fileKey); } catch (_) { /* ignore R2 errors */ }
    }
    await TeacherMaterialFile.deleteMany({ owner: req.user._id, folder: { $in: allFolderIds } });
    await TeacherMaterialFolder.deleteMany({ _id: { $in: allFolderIds } });

    return res.json({ message: 'Folder deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const collectDescendantIds = async (parentId, ownerId) => {
  const children = await TeacherMaterialFolder.find({ parentFolder: parentId, owner: ownerId }, '_id');
  const ids = children.map((c) => c._id);
  for (const id of [...ids]) {
    const nested = await collectDescendantIds(id, ownerId);
    ids.push(...nested);
  }
  return ids;
};

// ─── Files ────────────────────────────────────────────────────────────────────

// GET /teacher-materials/files?folder=<id>
const getFiles = async (req, res) => {
  try {
    const { folder } = req.query;
    if (!folder) return res.status(400).json({ message: 'folder query param required' });

    const folderDoc = await TeacherMaterialFolder.findOne({ _id: folder, owner: req.user._id });
    if (!folderDoc) return res.status(404).json({ message: 'Folder not found' });

    const files = await TeacherMaterialFile.find({ owner: req.user._id, folder, status: 'active' }).sort({
      createdAt: -1,
    });

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

// POST /teacher-materials/files/presign
const presignUpload = async (req, res) => {
  try {
    const { folderId, fileName, fileSize, mimeType } = req.body;
    if (!folderId || !fileName || !fileSize || !mimeType) {
      return res.status(400).json({ message: 'folderId, fileName, fileSize, mimeType are required' });
    }

    const folder = await TeacherMaterialFolder.findOne({ _id: folderId, owner: req.user._id, type: 'course' });
    if (!folder) return res.status(404).json({ message: 'Course folder not found' });

    const fileId = uuidv4();
    const fileKey = `teacher-materials/${req.user._id}/${folderId}/${fileId}-${fileName}`;

    const file = await TeacherMaterialFile.create({
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
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /teacher-materials/files/confirm — also propagates to any linked section courses
const confirmUpload = async (req, res) => {
  try {
    const { fileId } = req.body;
    if (!fileId) return res.status(400).json({ message: 'fileId is required' });

    const file = await TeacherMaterialFile.findOneAndUpdate(
      { _id: fileId, owner: req.user._id, status: 'pending' },
      { status: 'active' },
      { new: true }
    );

    if (!file) return res.status(404).json({ message: 'Pending file not found' });

    await propagateFileToLinks(file);

    return res.json(file);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /teacher-materials/files/:id
const renameFile = async (req, res) => {
  try {
    const { fileName } = req.body;
    if (!fileName) return res.status(400).json({ message: 'fileName is required' });

    const file = await TeacherMaterialFile.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id, status: 'active' },
      { fileName },
      { new: true, runValidators: true }
    );

    if (!file) return res.status(404).json({ message: 'File not found' });
    
    // Propagate the rename to all mirrored copies
    await propagateFileRenameToLinks(file._id, fileName);
    
    // Attach fresh presigned download URL
    const downloadUrl = await generatePresignedDownloadUrl(file.fileKey);
    return res.json({ ...file.toJSON(), downloadUrl });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /teacher-materials/files/:id — also removes any mirrored copies
const deleteFile = async (req, res) => {
  try {
    const file = await TeacherMaterialFile.findOne({ _id: req.params.id, owner: req.user._id });
    if (!file) return res.status(404).json({ message: 'File not found' });

    await removeMirroredCopies(file._id);
    try { await deleteObject(file.fileKey); } catch (_) { /* continue even if R2 fails */ }
    await file.deleteOne();

    return res.json({ message: 'File deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
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
};
