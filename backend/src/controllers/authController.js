const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Viewer = require('../models/Viewer');
const SocialAccount = require('../models/SocialAccount');

const creatorEmail = (process.env.CREATOR_EMAIL || 'ariesavy9@gmail.com').trim().toLowerCase();

function createToken(user, role) {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required.');
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role },
    process.env.JWT_SECRET,
    { expiresIn: '12h' },
  );
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isCreatorEmail(email) {
  return email.toLowerCase() === creatorEmail;
}

async function viewerRegister(req, res, next) {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (!name || name.length > 80 || !isValidEmail(email)) {
      return res.status(400).json({ message: 'Enter your name and a valid email address.' });
    }
    if (isCreatorEmail(email)) {
      return res.status(403).json({ message: 'The creator account must sign in with Google.' });
    }
    if (password.length < 8 || password.length > 128) {
      return res.status(400).json({ message: 'Your password must be between 8 and 128 characters.' });
    }
    if (await Viewer.exists({ email })) {
      return res.status(409).json({ message: 'An account with this email already exists. Sign in instead.' });
    }
    const viewer = await Viewer.create({
      name,
      email,
      passwordHash: await bcrypt.hash(password, 12),
    });
    return res.status(201).json({
      token: createToken(viewer, 'viewer'),
      user: { id: viewer.id, name: viewer.name, email: viewer.email, role: 'viewer' },
    });
  } catch (error) {
    return next(error);
  }
}

async function viewerLogin(req, res, next) {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (!isValidEmail(email) || !password) {
      return res.status(400).json({ message: 'Enter a valid email address and password.' });
    }
    if (isCreatorEmail(email)) {
      return res.status(403).json({ message: 'The creator account must sign in with Google.' });
    }
    const viewer = await Viewer.findOne({ email }).select('+passwordHash');
    if (!viewer?.passwordHash || !(await bcrypt.compare(password, viewer.passwordHash))) {
      return res.status(401).json({ message: 'Email or password is incorrect.' });
    }
    return res.json({
      token: createToken(viewer, 'viewer'),
      user: { id: viewer.id, name: viewer.name, email: viewer.email, role: 'viewer' },
    });
  } catch (error) {
    return next(error);
  }
}

async function googleCreatorLogin(req, res, next) {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ message: 'Complete Google sign-in to continue to the creator studio.' });
    }
    if (!process.env.GOOGLE_CLIENT_ID) throw new Error('GOOGLE_CLIENT_ID is not configured.');
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
    );
    if (!response.ok) return res.status(401).json({ message: 'Google sign-in could not be verified.' });
    const profile = await response.json();
    if (profile.aud !== process.env.GOOGLE_CLIENT_ID || String(profile.email_verified) !== 'true' || !profile.sub || !profile.email) {
      return res.status(401).json({ message: 'Google returned an unverified or unexpected account.' });
    }

    const email = profile.email.trim().toLowerCase();
    const name = profile.name || email.split('@')[0];
    if (isCreatorEmail(email)) {
      let creator = await User.findOne({ email });
      if (!creator) {
        creator = new User({ name, email, googleId: profile.sub, role: 'creator' });
      } else {
        if (creator.googleId && creator.googleId !== profile.sub) {
          return res.status(409).json({ message: 'The configured creator email is linked to a different Google account.' });
        }
        creator.googleId = profile.sub;
        creator.name = creator.name || name;
        if (profile.picture) creator.imageUrl = profile.picture;
      }
      await creator.save();

      const youtubeAccount = await SocialAccount.findOne({
        provider: 'google',
        email,
        accountId: profile.sub,
      });
      if (youtubeAccount && String(youtubeAccount.connectedBy) !== creator.id) {
        youtubeAccount.connectedBy = creator.id;
        await youtubeAccount.save();
      }
      return res.json({
        token: createToken(creator, 'creator'),
        user: { id: creator.id, name: creator.name, email: creator.email, imageUrl: creator.imageUrl, role: 'creator' },
      });
    }

    let viewer = await Viewer.findOne({ googleId: profile.sub });
    if (!viewer) viewer = await Viewer.findOne({ email });
    if (!viewer) viewer = new Viewer({ name, email, googleId: profile.sub, imageUrl: profile.picture || '' });
    else if (viewer.googleId && viewer.googleId !== profile.sub) {
      return res.status(409).json({ message: 'This email is already linked to a different Google account.' });
    } else {
      viewer.googleId = profile.sub;
      viewer.name = viewer.name || name;
      if (profile.picture) viewer.imageUrl = profile.picture;
    }
    await viewer.save();
    return res.json({
      token: createToken(viewer, 'viewer'),
      user: { id: viewer.id, name: viewer.name, email: viewer.email, imageUrl: viewer.imageUrl, role: 'viewer' },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { viewerRegister, viewerLogin, googleCreatorLogin };
