const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  viewerRegister,
  viewerLogin,
  googleCreatorLogin,
} = require('../controllers/authController');

const router = express.Router();
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many sign-in attempts. Please wait and try again.' },
});

router.post('/viewer/register', loginLimiter, viewerRegister);
router.post('/viewer/login', loginLimiter, viewerLogin);
router.post('/google', loginLimiter, googleCreatorLogin);

module.exports = router;
