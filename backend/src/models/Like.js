const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema(
  {
    content: { type: mongoose.Schema.Types.ObjectId, ref: 'Content', required: true },
    viewerId: { type: String, required: true, trim: true, maxlength: 100 },
  },
  { timestamps: true },
);

likeSchema.index({ content: 1, viewerId: 1 }, { unique: true });

module.exports = mongoose.model('Like', likeSchema);
