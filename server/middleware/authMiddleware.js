const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const hasBearer = authHeader.startsWith('Bearer ');

  if (!hasBearer) {
    res.status(401);
    throw new Error('Not authorized, token missing');
  }

  const token = authHeader.split(' ')[1];

  try {
    if (!process.env.JWT_SECRET) {
      res.status(500);
      throw new Error('Server JWT_SECRET is not configured');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      res.status(401);
      throw new Error('Not authorized, user no longer exists');
    }
    if (user.isActive === false) {
      res.status(403);
      throw new Error('Account is disabled');
    }
    req.user = user;
    next();
  } catch (error) {
    if (res.statusCode === 200) {
      res.status(401);
    }
    if (error.message === 'Server JWT_SECRET is not configured') {
      throw error;
    }
    if (error.name === 'TokenExpiredError') {
      throw new Error('Not authorized, token expired. Please login again');
    }
    throw new Error('Not authorized, token invalid');
  }
});

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403);
      throw new Error('Forbidden: insufficient role permission');
    }
    next();
  };
};

module.exports = {
  protect,
  authorize,
};
