const express = require('express');
const {
  addStudent,
  getStudents,
  markAttendance,
  deleteStudent, // Added
  updateStudent, // Added
  getDashboardStats,
} = require('../controllers/tuitionController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.post('/add-student', addStudent);
router.get('/get-students', getStudents);
router.put('/mark-attendance', markAttendance);
router.delete('/delete-student/:id', deleteStudent); // Added
router.put('/update-student/:id', updateStudent);     // Added
router.get('/dashboard-stats', getDashboardStats);

module.exports = router;
