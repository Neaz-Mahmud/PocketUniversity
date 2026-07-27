// Cascade deletion for users and sections. Shared by the admin "delete" actions
// and the auto-deletion cleanup job so both remove the same set of dependent
// records and best-effort delete the underlying R2 objects.
const PersonalFile = require('../models/PersonalFile');
const PersonalFolder = require('../models/PersonalFolder');
const TeacherMaterialFile = require('../models/TeacherMaterialFile');
const TeacherMaterialFolder = require('../models/TeacherMaterialFolder');
const Material = require('../models/Material');
const Semester = require('../models/Semester');
const Course = require('../models/Course');
const Section = require('../models/Section');
const SectionMembership = require('../models/SectionMembership');
const MirrorLink = require('../models/MirrorLink');
const MirrorRequest = require('../models/MirrorRequest');
const Notice = require('../models/Notice');
const Notification = require('../models/Notification');
const RefreshToken = require('../models/RefreshToken');
const User = require('../models/User');
const OldBook = require('../models/OldBook');
const BookOrder = require('../models/BookOrder');
const { deleteObject } = require('./r2Service');

const bestEffortDelete = async (keys) => {
  for (const key of keys) {
    if (!key) continue;
    try {
      await deleteObject(key);
    } catch (_) {
      // R2 failures shouldn't block DB cleanup.
    }
  }
};

/**
 * Delete a user and everything they own: personal files/folders, shared teacher
 * materials (and the mirrored copies they seeded), memberships, mirror
 * requests/links, notifications, and refresh tokens.
 */
const deleteUserCascade = async (userId) => {
  // Personal storage
  const personalFiles = await PersonalFile.find({ owner: userId }, 'fileKey');
  await bestEffortDelete(personalFiles.map((f) => f.fileKey));
  await PersonalFile.deleteMany({ owner: userId });
  await PersonalFolder.deleteMany({ owner: userId });

  // Shared teacher materials + the section-side mirrored copies they seeded
  const teacherFiles = await TeacherMaterialFile.find({ owner: userId }, '_id fileKey');
  await bestEffortDelete(teacherFiles.map((f) => f.fileKey));
  const teacherFileIds = teacherFiles.map((f) => f._id);
  if (teacherFileIds.length) {
    await Material.deleteMany({ sourceFile: { $in: teacherFileIds } });
  }
  await TeacherMaterialFile.deleteMany({ owner: userId });
  await TeacherMaterialFolder.deleteMany({ owner: userId });
  await MirrorLink.deleteMany({ teacher: userId });

  // Marketplace: remove the user's book listings (and their photos); orders
  // they placed keep their contact snapshot but drop the dangling account ref.
  const listings = await OldBook.find({ seller: userId }, 'imageKeys');
  await bestEffortDelete(listings.flatMap((l) => l.imageKeys || []));
  await OldBook.deleteMany({ seller: userId });
  await BookOrder.updateMany({ buyer: userId }, { $set: { buyer: null } });

  // Section relationships & misc
  await SectionMembership.deleteMany({ user: userId });
  await MirrorRequest.deleteMany({ $or: [{ requestedTeacher: userId }, { requestedBy: userId }] });
  await Notification.deleteMany({ user: userId });
  await RefreshToken.deleteMany({ user: userId });

  await User.findByIdAndDelete(userId);
};

/**
 * Delete a section and its content tree: semesters → courses → materials
 * (R2 objects included), plus notices, memberships, mirror links/requests, and
 * notifications tied to the section.
 */
const deleteSectionCascade = async (sectionId) => {
  const semesters = await Semester.find({ section: sectionId }, '_id');
  const semesterIds = semesters.map((s) => s._id);
  const courses = await Course.find({ semester: { $in: semesterIds } }, '_id');
  const courseIds = courses.map((c) => c._id);

  const materials = await Material.find({ course: { $in: courseIds } }, 'fileKey');
  await bestEffortDelete(materials.map((m) => m.fileKey));
  await Material.deleteMany({ course: { $in: courseIds } });
  await Course.deleteMany({ _id: { $in: courseIds } });
  await Semester.deleteMany({ _id: { $in: semesterIds } });

  await Notice.deleteMany({ section: sectionId });
  await SectionMembership.deleteMany({ section: sectionId });
  await MirrorLink.deleteMany({ section: sectionId });
  await MirrorRequest.deleteMany({ section: sectionId });
  await Notification.deleteMany({ section: sectionId });

  await Section.findByIdAndDelete(sectionId);
};

module.exports = { deleteUserCascade, deleteSectionCascade };
