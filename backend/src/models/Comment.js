const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    content: { type: mongoose.Schema.Types.ObjectId, ref: 'Content', required: true, index: true },
    parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null, index: true },
    authorId: { type: String, default: '', trim: true, maxlength: 100, index: true },
    authorEmail: { type: String, default: '', lowercase: true, trim: true, maxlength: 254 },
    displayName: { type: String, required: true, trim: true, maxlength: 60 },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    likesCount: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ['Pending', 'Approved', 'Hidden'], default: 'Approved' },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Comment', commentSchema);
