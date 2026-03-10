const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getAdminStats,
  getUsers,
  updateUserRole,
  updateUserStatus,
  adminResetPassword,
} = require('../controllers/adminController');

const router = express.Router();

router.use(protect, authorize('admin'));
router.get('/stats', getAdminStats);
router.get('/users', getUsers);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/status', updateUserStatus);
router.post('/users/:id/reset-password', adminResetPassword);

module.exports = router;
