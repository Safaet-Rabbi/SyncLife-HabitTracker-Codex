const crypto = require('crypto');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const generateToken = require('../utils/generateToken');

const normalizeEmail = (value = '') => String(value).trim().toLowerCase();
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
const refreshCookieName = process.env.REFRESH_TOKEN_COOKIE_NAME || 'rt';
const refreshTokenTtlDays = Number(process.env.REFRESH_TOKEN_TTL_DAYS || 14);

const toPublicUser = (userDoc) => ({
  id: userDoc._id,
  name: userDoc.name,
  email: userDoc.email,
  role: userDoc.role,
  preferences: userDoc.preferences,
});

const setRefreshCookie = (res, rawToken, expiresAt) => {
  res.cookie(refreshCookieName, rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/v1/auth',
    expires: expiresAt,
  });
};

const clearRefreshCookie = (res) => {
  res.clearCookie(refreshCookieName, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/v1/auth',
  });
};

const issueSession = async ({ user, req, res, replaceOldHash = null }) => {
  const accessToken = generateToken({ id: user._id });
  const rawRefreshToken = crypto.randomBytes(48).toString('hex');
  const refreshHash = hashToken(rawRefreshToken);
  const expiresAt = new Date(Date.now() + refreshTokenTtlDays * 24 * 60 * 60 * 1000);

  await RefreshToken.create({
    user: user._id,
    tokenHash: refreshHash,
    expiresAt,
    replacedByTokenHash: null,
    meta: {
      ip: req.ip || '',
      userAgent: req.get('user-agent') || '',
    },
  });

  if (replaceOldHash) {
    await RefreshToken.updateOne(
      { tokenHash: replaceOldHash, revokedAt: null },
      { revokedAt: new Date(), replacedByTokenHash: refreshHash }
    );
  }

  setRefreshCookie(res, rawRefreshToken, expiresAt);

  return {
    token: accessToken,
    user: toPublicUser(user),
  };
};

// @desc Register user
// @route POST /api/v1/auth/register
// @access Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const normalizedName = String(name || '').trim();
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedName || !normalizedEmail || !password) {
    res.status(400);
    throw new Error('Name, email and password are required');
  }

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    res.status(409);
    throw new Error('Email already exists. Please login with this email.');
  }

  const user = await User.create({
    name: normalizedName,
    email: normalizedEmail,
    password,
  });

  const payload = await issueSession({ user, req, res });
  res.status(201).json(payload);
});

// @desc Login user
// @route POST /api/v1/auth/login
// @access Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ email: normalizedEmail }).select('+password');

  if (!user || !(await user.matchPassword(password || ''))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }
  if (user.isActive === false) {
    res.status(403);
    throw new Error('Account is disabled. Contact admin.');
  }

  const payload = await issueSession({ user, req, res });
  res.json(payload);
});

// @desc Refresh access token (rotating refresh token)
// @route POST /api/v1/auth/refresh
// @access Public
const refreshSession = asyncHandler(async (req, res) => {
  const rawRefreshToken = req.cookies?.[refreshCookieName];
  if (!rawRefreshToken) {
    res.status(401);
    throw new Error('Refresh token missing. Please login again.');
  }

  const oldHash = hashToken(rawRefreshToken);
  const tokenDoc = await RefreshToken.findOne({
    tokenHash: oldHash,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  }).populate('user');

  if (!tokenDoc || !tokenDoc.user) {
    clearRefreshCookie(res);
    res.status(401);
    throw new Error('Refresh token invalid or expired. Please login again.');
  }

  const payload = await issueSession({
    user: tokenDoc.user,
    req,
    res,
    replaceOldHash: oldHash,
  });
  res.json(payload);
});

// @desc Logout current session
// @route POST /api/v1/auth/logout
// @access Public (cookie based)
const logoutUser = asyncHandler(async (req, res) => {
  const rawRefreshToken = req.cookies?.[refreshCookieName];
  if (rawRefreshToken) {
    const tokenHash = hashToken(rawRefreshToken);
    await RefreshToken.updateOne({ tokenHash, revokedAt: null }, { revokedAt: new Date() });
  }
  clearRefreshCookie(res);
  res.json({ message: 'Logged out successfully' });
});

// @desc Forgot password
// @route POST /api/v1/auth/forgot-password
// @access Public
const forgotPassword = asyncHandler(async (req, res) => {
  const normalizedEmail = normalizeEmail(req.body.email);
  if (!normalizedEmail) {
    res.status(400);
    throw new Error('Email is required');
  }

  const user = await User.findOne({ email: normalizedEmail }).select('+password');
  if (!user) {
    return res.json({ message: 'If this email exists, password reset instructions are generated.' });
  }

  const rawResetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetTokenHash = hashToken(rawResetToken);
  user.passwordResetExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min
  await user.save();

  const payload = { message: 'Reset token generated' };
  if (process.env.NODE_ENV !== 'production') {
    payload.resetToken = rawResetToken;
    payload.resetPath = `/api/v1/auth/reset-password`;
  }

  res.json(payload);
});

// @desc Reset password with token
// @route POST /api/v1/auth/reset-password
// @access Public
const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    res.status(400);
    throw new Error('token and newPassword are required');
  }
  if (String(newPassword).length < 6) {
    res.status(400);
    throw new Error('newPassword must be at least 6 characters');
  }

  const tokenHash = hashToken(token);
  const user = await User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpiresAt: { $gt: new Date() },
  }).select('+password');

  if (!user) {
    res.status(400);
    throw new Error('Reset token is invalid or expired');
  }

  user.password = newPassword;
  user.passwordResetTokenHash = null;
  user.passwordResetExpiresAt = null;
  await user.save();

  res.json({ message: 'Password reset successful. Please login again.' });
});

// @desc Get current user
// @route GET /api/v1/auth/me
// @access Private
const getMe = asyncHandler(async (req, res) => {
  res.json({
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    isActive: req.user.isActive,
    preferences: req.user.preferences,
    createdAt: req.user.createdAt,
  });
});

// @desc Update profile
// @route PUT /api/v1/auth/me
// @access Private
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const { name, password, preferences } = req.body;
  if (name) user.name = String(name).trim();
  if (password) user.password = password;
  if (preferences) user.preferences = { ...user.preferences, ...preferences };

  const updated = await user.save();
  res.json({
    id: updated._id,
    name: updated.name,
    email: updated.email,
    role: updated.role,
    preferences: updated.preferences,
  });
});

module.exports = {
  registerUser,
  loginUser,
  refreshSession,
  logoutUser,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
};
