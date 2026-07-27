const { v4: uuidv4 } = require('uuid');
const JobPost = require('../models/JobPost');
const {
  generatePresignedUploadUrl,
  generatePresignedDownloadUrl,
  deleteObject,
} = require('../services/r2Service');

// Attach signed URLs to a post's cover and to each image/file block so the
// client can render/download them.
const signPost = async (doc) => {
  const obj = doc.toJSON ? doc.toJSON() : doc;
  obj.coverUrl = obj.coverKey ? await generatePresignedDownloadUrl(obj.coverKey) : null;
  obj.blocks = await Promise.all(
    (obj.blocks || []).map(async (b) => {
      if (b.type === 'image' && b.imageKey) return { ...b, imageUrl: await generatePresignedDownloadUrl(b.imageKey) };
      if (b.type === 'file' && b.fileKey) return { ...b, fileUrl: await generatePresignedDownloadUrl(b.fileKey) };
      return b;
    })
  );
  return obj;
};

// Collect every R2 key a post references, for cleanup on delete.
const collectKeys = (post) => {
  const keys = [];
  if (post.coverKey) keys.push(post.coverKey);
  (post.blocks || []).forEach((b) => {
    if (b.imageKey) keys.push(b.imageKey);
    if (b.fileKey) keys.push(b.fileKey);
  });
  return keys;
};

// ─── Public ─────────────────────────────────────────────────────────────────

// GET /jobs (public) — published posts, optional category + search
const listJobs = async (req, res) => {
  try {
    const { category, q } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = 20;

    const filter = { published: true };
    if (category && ['government', 'non-government', 'other'].includes(category)) filter.category = category;
    if (q) {
      const regex = new RegExp(q.trim(), 'i');
      filter.$or = [{ organization: regex }, { position: regex }, { summary: regex }];
    }

    const [docs, total] = await Promise.all([
      JobPost.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).select('-blocks'),
      JobPost.countDocuments(filter),
    ]);

    const posts = await Promise.all(docs.map(async (d) => {
      const obj = d.toJSON();
      obj.coverUrl = obj.coverKey ? await generatePresignedDownloadUrl(obj.coverKey) : null;
      return obj;
    }));

    return res.json({ posts, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /jobs/:id (public) — a single published post with signed asset URLs
const getJob = async (req, res) => {
  try {
    const post = await JobPost.findById(req.params.id);
    if (!post || !post.published) return res.status(404).json({ message: 'Post not found' });
    return res.json(await signPost(post));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─── Admin ──────────────────────────────────────────────────────────────────

// POST /jobs/admin/upload/presign  { target: 'cover'|'image'|'file', mimeType, fileName }
const presignJobAsset = async (req, res) => {
  try {
    const { target, mimeType, fileName } = req.body;
    if (!['cover', 'image', 'file'].includes(target)) {
      return res.status(400).json({ message: "target must be 'cover', 'image' or 'file'" });
    }
    if (!mimeType) return res.status(400).json({ message: 'mimeType is required' });

    let ext = (mimeType.split('/')[1] || 'bin').split('+')[0];
    if (target === 'file' && fileName && fileName.includes('.')) ext = fileName.split('.').pop();
    const fileKey = `jobs/${target}/${uuidv4()}.${ext}`;
    const presignedUrl = await generatePresignedUploadUrl(fileKey, mimeType);
    return res.json({ fileKey, presignedUrl });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const sanitizeBlocks = (blocks) =>
  (Array.isArray(blocks) ? blocks : [])
    .filter((b) => b && ['text', 'image', 'youtube', 'file', 'react'].includes(b.type))
    .map((b) => ({
      type: b.type,
      text: b.type === 'text' ? String(b.text || '') : '',
      imageKey: b.type === 'image' ? b.imageKey || null : null,
      youtubeUrl: b.type === 'youtube' ? String(b.youtubeUrl || '') : '',
      fileKey: b.type === 'file' ? b.fileKey || null : null,
      fileName: b.type === 'file' ? String(b.fileName || '') : '',
      code: b.type === 'react' ? String(b.code || '') : '',
    }));

// POST /jobs/admin
const createJob = async (req, res) => {
  try {
    const { organization, position, category, summary, coverKey, blocks, published } = req.body;
    if (!organization) return res.status(400).json({ message: 'organization is required' });

    const post = await JobPost.create({
      organization, position, category, summary,
      coverKey: coverKey || null,
      blocks: sanitizeBlocks(blocks),
      published: published !== false,
      postedBy: req.user._id,
    });
    return res.status(201).json(post);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /jobs/admin — all posts (published or not)
const adminListJobs = async (req, res) => {
  try {
    const docs = await JobPost.find({}).sort({ createdAt: -1 }).select('-blocks');
    const posts = await Promise.all(docs.map(async (d) => {
      const obj = d.toJSON();
      obj.coverUrl = obj.coverKey ? await generatePresignedDownloadUrl(obj.coverKey) : null;
      return obj;
    }));
    return res.json(posts);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /jobs/admin/:id — single post for editing (signed asset URLs)
const adminGetJob = async (req, res) => {
  try {
    const post = await JobPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    return res.json(await signPost(post));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /jobs/admin/:id
const updateJob = async (req, res) => {
  try {
    const post = await JobPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const { organization, position, category, summary, coverKey, blocks, published } = req.body;
    if (organization !== undefined) post.organization = organization;
    if (position !== undefined) post.position = position;
    if (category !== undefined) post.category = category;
    if (summary !== undefined) post.summary = summary;
    if (coverKey !== undefined) post.coverKey = coverKey || null;
    if (blocks !== undefined) post.blocks = sanitizeBlocks(blocks);
    if (published !== undefined) post.published = published;

    await post.save();
    return res.json(post);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /jobs/admin/:id — also best-effort removes R2 assets
const deleteJob = async (req, res) => {
  try {
    const post = await JobPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    for (const key of collectKeys(post)) {
      try { await deleteObject(key); } catch (_) { /* ignore */ }
    }
    await post.deleteOne();
    return res.json({ message: 'Post deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  listJobs, getJob,
  presignJobAsset, createJob, adminListJobs, adminGetJob, updateJob, deleteJob,
};
