const MirrorLink = require('../models/MirrorLink');
const TeacherMaterialFile = require('../models/TeacherMaterialFile');
const Material = require('../models/Material');

/**
 * Called after a teacher's Share Material file is confirmed as uploaded.
 * If its folder is linked to any section course(s), create a mirrored
 * (active) Material row in each — same fileKey, no re-upload, no duplicate
 * storage in R2.
 */
const propagateFileToLinks = async (teacherFile) => {
  const links = await MirrorLink.find({ sourceFolder: teacherFile.folder });
  if (links.length === 0) return [];

  const created = [];
  for (const link of links) {
    // Avoid duplicating if this file was already mirrored into this course
    const exists = await Material.findOne({ course: link.targetCourse, mirroredFrom: teacherFile._id });
    if (exists) continue;

    const material = await Material.create({
      course: link.targetCourse,
      fileName: teacherFile.fileName,
      fileKey: teacherFile.fileKey,
      fileSize: teacherFile.fileSize,
      mimeType: teacherFile.mimeType,
      uploadedBy: teacherFile.owner,
      status: 'active',
      mirroredFrom: teacherFile._id,
    });
    created.push(material);
  }
  return created;
};

/**
 * Called when a teacher deletes a Share Material file — removes any
 * mirrored copies in linked section courses too (but does NOT touch the R2
 * object here; the caller is responsible for that, and only if no other
 * row still references the same fileKey).
 */
const removeMirroredCopies = async (teacherFileId) => {
  await Material.deleteMany({ mirroredFrom: teacherFileId });
};

/**
 * Called when a teacher renames a Share Material file.
 * Updates the filename of all mirrored copies to match.
 */
const propagateFileRenameToLinks = async (teacherFileId, newName) => {
  await Material.updateMany({ mirroredFrom: teacherFileId }, { fileName: newName });
};

/**
 * Called right after a MirrorLink is created (i.e. a mirror request was
 * approved) — backfills every already-active file in the source folder
 * into the newly linked section course.
 */
const backfillLink = async (link) => {
  const files = await TeacherMaterialFile.find({ folder: link.sourceFolder, status: 'active' });
  const created = [];
  for (const file of files) {
    const exists = await Material.findOne({ course: link.targetCourse, mirroredFrom: file._id });
    if (exists) continue;

    const material = await Material.create({
      course: link.targetCourse,
      fileName: file.fileName,
      fileKey: file.fileKey,
      fileSize: file.fileSize,
      mimeType: file.mimeType,
      uploadedBy: file.owner,
      status: 'active',
      mirroredFrom: file._id,
    });
    created.push(material);
  }
  return created;
};

module.exports = { propagateFileToLinks, removeMirroredCopies, propagateFileRenameToLinks, backfillLink };
