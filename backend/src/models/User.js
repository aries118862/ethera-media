const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    imageUrl: { type: String, trim: true, default: '' },
    publicAge: { type: Number, min: 13, max: 120, default: null },
    passwordHash: { type: String, select: false },
    googleId: { type: String, default: undefined },
    role: { type: String, enum: ['creator'], default: 'creator' },
  },
  { timestamps: true },
);

userSchema.index({ googleId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('User', userSchema);
