const mongoose = require('mongoose');
const Comment = require('../models/Comment');
const CommentLike = require('../models/CommentLike');
const Content = require('../models/Content');
const Notification = require('../models/Notification');
const createNotification = require('../services/createNotification');

const publishedFilter = {
  status: 'Published',
  $or: [{ publishedAt: null }, { publishedAt: { $lte: new Date() } }],
};

async function createComment(req, res, next) {
  try {
    const body = req.body || {};
    const displayName = String(req.authUser.name || body.displayName || '').trim();
    const message = String(body.message || '').trim();
    if (!body.contentId || !message) return res.status(400).json({ message: 'Content and comment text are required.' });
    if (!displayName || displayName.length > 60 || message.length > 1000) {
      return res.status(400).json({ message: 'Enter a name (up to 60 characters) and comment (up to 1000 characters).' });
    }
    const content = await Content.findOne({ _id: body.contentId, ...publishedFilter });
    if (!content) return res.status(404).json({ message: 'Content not found.' });
    let parentComment = null;
    if (body.parentCommentId) {
      parentComment = await Comment.findOne({
        _id: body.parentCommentId,
        content: content._id,
        status: 'Approved',
      }).select('_id authorId authorEmail displayName').lean();
      if (!parentComment) return res.status(404).json({ message: 'Comment not found or is not available for replies.' });
    }
    const comment = await Comment.create({
      content: content._id,
      parentComment: parentComment?._id || null,
      authorId: String(req.authUser.id),
      authorEmail: String(req.authUser.email || '').trim().toLowerCase(),
      displayName,
      message,
    });
    if (parentComment?.authorId && parentComment.authorId !== String(req.authUser.id)) {
      await Notification.create({
        recipientEmail: parentComment.authorEmail || req.authUser.email,
        recipientId: parentComment.authorId,
        actorId: String(req.authUser.id),
        actorName: displayName,
        type: 'comment',
        content: content._id,
        contentTitle: String(content.title || 'Untitled content').trim().slice(0, 140),
        message: `replied to your comment: "${message.slice(0, 160)}"`,
        eventKey: `comment-reply:${comment.id}`,
      });
    }
    if (req.authUser.role !== 'creator') {
      await createNotification({
        actor: { id: req.authUser.id, name: displayName },
        content,
        type: 'comment',
        message: `commented: "${message.slice(0, 160)}"`,
        eventKey: `comment:${comment.id}`,
      });
    }
    const createdComment = comment.toObject();
    delete createdComment.authorId;
    delete createdComment.authorEmail;
    return res.status(201).json({ comment: { ...createdComment, likesCount: 0, likedByViewer: false, replies: [] } });
  } catch (error) {
    return next(error);
  }
}

async function createReply(req, res, next) {
  try {
    const parent = await Comment.findOne({ _id: req.params.id, status: 'Approved' }).select('content').lean();
    if (!parent) return res.status(404).json({ message: 'Comment not found or is not available for replies.' });
    req.body = { ...(req.body || {}), contentId: parent.content, parentCommentId: req.params.id };
    return createComment(req, res, next);
  } catch (error) {
    return next(error);
  }
}

async function listComments(req, res, next) {
  try {
    const filter = { content: req.params.contentId };
    filter.status = 'Approved';
    const records = await Comment.find(filter).select('-authorId -authorEmail').sort({ createdAt: -1 }).lean();
    const commentIds = records.map((comment) => comment._id);
    const [likeCounts, viewerLikes] = await Promise.all([
      commentIds.length
        ? CommentLike.aggregate([
          { $match: { comment: { $in: commentIds } } },
          { $group: { _id: '$comment', count: { $sum: 1 } } },
        ])
        : [],
      req.authUser && commentIds.length
        ? CommentLike.find({ comment: { $in: commentIds }, viewerId: req.authUser.id }).select('comment').lean()
        : [],
    ]);
    const countById = new Map(likeCounts.map((item) => [String(item._id), item.count]));
    const viewerLikeIds = new Set(viewerLikes.map((item) => String(item.comment)));
    const commentById = new Map(records.map((comment) => [
      String(comment._id),
      {
        ...comment,
        likesCount: countById.get(String(comment._id)) || 0,
        likedByViewer: viewerLikeIds.has(String(comment._id)),
        replies: [],
      },
    ]));
    const comments = [];
    for (const comment of commentById.values()) {
      const parentId = comment.parentComment ? String(comment.parentComment) : null;
      if (parentId && commentById.has(parentId)) commentById.get(parentId).replies.push(comment);
      else if (!parentId) comments.push(comment);
    }
    return res.json({ comments });
  } catch (error) {
    return next(error);
  }
}

async function listRecentComments(req, res, next) {
  try {
    const records = await Comment.find({ status: 'Approved' })
      .sort({ createdAt: -1 })
      .limit(8)
      .select('_id displayName message createdAt content parentComment')
      .lean();
    const contentIds = records.map((comment) => comment.content).filter((id) => mongoose.Types.ObjectId.isValid(id));
    const parentIds = records.map((comment) => comment.parentComment).filter((id) => id && mongoose.Types.ObjectId.isValid(id));
    const [contents, parents] = await Promise.all([
      Content.find({ _id: { $in: contentIds } }).select('title').lean(),
      parentIds.length ? Comment.find({ _id: { $in: parentIds } }).select('displayName').lean() : [],
    ]);
    const contentById = new Map(contents.map((content) => [String(content._id), content]));
    const parentById = new Map(parents.map((parent) => [String(parent._id), parent]));
    const comments = records.map((comment) => {
      const content = contentById.get(String(comment.content));
      const parent = comment.parentComment ? parentById.get(String(comment.parentComment)) : null;
      return content && ({
      _id: comment._id,
      displayName: comment.displayName,
      message: comment.message,
      createdAt: comment.createdAt,
      parentComment: parent ? { displayName: parent.displayName } : null,
      content: { _id: comment.content, title: content.title },
      });
    }).filter(Boolean);
    return res.json({ comments });
  } catch (error) {
    return next(error);
  }
}

async function toggleCommentLike(req, res, next) {
  try {
    const comment = await Comment.findOne({ _id: req.params.id, status: 'Approved' })
      .select('content authorId authorEmail displayName')
      .lean();
    if (!comment) return res.status(404).json({ message: 'Comment not found.' });
    const content = await Content.findOne({ _id: comment.content, ...publishedFilter }).select('_id title').lean();
    if (!content) return res.status(404).json({ message: 'Content not found.' });

    const filter = { comment: comment._id, viewerId: req.authUser.id };
    const removed = await CommentLike.findOneAndDelete(filter);
    let liked = false;
    let createdLike = null;
    if (!removed) {
      try {
        createdLike = await CommentLike.create(filter);
        liked = true;
      } catch (error) {
        if (error.code !== 11000) throw error;
        liked = true;
      }
    }
    if (createdLike && comment.authorId && comment.authorId !== String(req.authUser.id)) {
      await Notification.create({
        recipientEmail: comment.authorEmail || req.authUser.email,
        recipientId: comment.authorId,
        actorId: String(req.authUser.id),
        actorName: String(req.authUser.name || 'A viewer').trim().slice(0, 80),
        type: 'like',
        content: content._id,
        contentTitle: String(content.title || 'Untitled content').trim().slice(0, 140),
        message: 'liked your comment.',
        eventKey: `comment-like:${createdLike.id}`,
      });
    }
    const likesCount = await CommentLike.countDocuments({ comment: comment._id });
    return res.json({ liked, likesCount });
  } catch (error) {
    return next(error);
  }
}

async function listAllComments(req, res, next) {
  try {
    const comments = await Comment.find()
      .populate('content', 'title')
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ comments });
  } catch (error) {
    return next(error);
  }
}

async function moderateComment(req, res, next) {
  try {
    const { status } = req.body;
    if (status && !['Approved', 'Hidden'].includes(status)) {
      return res.status(400).json({ message: 'Comment status must be Approved or Hidden.' });
    }
    const comment = await Comment.findByIdAndUpdate(
      req.params.id,
      status ? { status } : {},
      { new: true, runValidators: true },
    );
    if (!comment) return res.status(404).json({ message: 'Comment not found.' });
    if (req.method === 'DELETE') {
      const ids = [comment._id];
      let level = [comment._id];
      while (level.length) {
        level = await Comment.find({ parentComment: { $in: level } }).distinct('_id');
        ids.push(...level);
      }
      await Promise.all([
        Comment.deleteMany({ _id: { $in: ids } }),
        CommentLike.deleteMany({ comment: { $in: ids } }),
      ]);
      return res.json({ message: 'Comment deleted.' });
    }
    return res.json({ comment });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createComment,
  createReply,
  listComments,
  listRecentComments,
  listAllComments,
  toggleCommentLike,
  moderateComment,
};
