const jwt = require('jsonwebtoken');

function isCreatorIdentity(user) {
  const creatorEmail = (process.env.CREATOR_EMAIL || 'ariesavy9@gmail.com').trim().toLowerCase();
  return ['creator', 'viewer'].includes(user.role)
    && String(user.email || '').trim().toLowerCase() === creatorEmail;
}

function authenticate(req, res, next) {
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : null;
  if (!token) return res.status(401).json({ message: 'Please sign in to continue.' });

  try {
    req.authUser = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ message: 'Your session has expired. Please sign in again.' });
  }
}

function requireCreator(req, res, next) {
  return authenticate(req, res, (error) => {
    if (error) return next(error);
    if (!isCreatorIdentity(req.authUser)) {
      return res.status(403).json({ message: 'Creator access is required.' });
    }
    req.creator = req.authUser;
    return next();
  });
}

function requireViewerOrCreator(req, res, next) {
  return authenticate(req, res, (error) => {
    if (error) return next(error);
    if (!['viewer', 'creator'].includes(req.authUser.role)) {
      return res.status(403).json({ message: 'Viewer sign-in is required.' });
    }
    req.creator = isCreatorIdentity(req.authUser) ? req.authUser : null;
    if (req.creator) req.authUser.role = 'creator';
    else req.authUser.role = 'viewer';
    return next();
  });
}

function optionalViewerOrCreator(req, res, next) {
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : null;
  req.creator = null;
  if (!token) return next();

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    if (['viewer', 'creator'].includes(user.role)) {
      req.authUser = user;
      req.creator = isCreatorIdentity(user) ? user : null;
      if (req.creator) req.authUser.role = 'creator';
    }
  } catch {
    // Public reads remain available when a browser sends an expired cached token.
  }
  return next();
}

module.exports = requireCreator;
module.exports.authenticate = authenticate;
module.exports.requireViewerOrCreator = requireViewerOrCreator;
module.exports.optionalViewerOrCreator = optionalViewerOrCreator;
