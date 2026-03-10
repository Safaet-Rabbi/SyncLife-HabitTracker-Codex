const Student = require('../models/Student');
const { startOfMonth, endOfMonth, isSameDay } = require('date-fns');

const attachAttendanceStats = (studentDoc) => {
  const student = studentDoc._doc ? studentDoc._doc : studentDoc;
  const attendanceRecords = Array.isArray(student.attendanceRecords) ? student.attendanceRecords : [];

  const totalPresentDays = attendanceRecords.filter((record) => record.status === true).length;

  const now = new Date();
  const startOfCurrentMonth = startOfMonth(now);
  const endOfCurrentMonth = endOfMonth(now);

  const monthlyPresentDays = attendanceRecords.filter((record) => {
    const date = new Date(record.date);
    return record.status === true && date >= startOfCurrentMonth && date <= endOfCurrentMonth;
  }).length;

  return { ...student, totalPresentDays, monthlyPresentDays };
};

const toUTCDateKey = (input) => {
  if (!input) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    const [y, m, d] = input.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d, 12, 0, 0, 0)); // noon UTC avoids date drift
  }

  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate(), 12, 0, 0, 0));
};

// @desc    Add a new student
// @route   POST /api/tuition/add-student
// @access  Private (You might add authentication later)
exports.addStudent = async (req, res) => {
  try {
    const { name, className, subjectCount, location, monthlyFee, joinedDate } = req.body;

    if (!name || !className || subjectCount === undefined || !location) {
      return res.status(400).json({ message: 'name, className, subjectCount and location are required.' });
    }

    const student = new Student({
      user: req.user._id,
      name,
      className,
      subjectCount: Number(subjectCount),
      location,
      monthlyFee: monthlyFee !== undefined ? Number(monthlyFee) : undefined,
      joinedDate: joinedDate || Date.now(),
    });

    await student.save();
    res.status(201).json({ message: 'Student added successfully', student: attachAttendanceStats(student) });
  } catch (error) {
    console.error('Error adding student:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Fetch all students with attendance stats
// @route   GET /api/tuition/get-students
// @access  Private
exports.getStudents = async (req, res) => {
  try {
    let students = await Student.find({ user: req.user._id }).sort({ createdAt: -1 });

    // Calculate total present days for each student
    students = students.map((student) => attachAttendanceStats(student));

    res.status(200).json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Toggle attendance for a specific student on a specific date
// @route   PUT /api/tuition/mark-attendance
// @access  Private
exports.markAttendance = async (req, res) => {
  try {
    const { studentId, date, status } = req.body; // status is optional, if not provided, toggle

    if (!studentId || !date) {
      return res.status(400).json({ message: 'Student ID and date are required.' });
    }

    const student = await Student.findOne({ _id: studentId, user: req.user._id });

    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    const attendanceDate = toUTCDateKey(date);
    if (!attendanceDate) {
      return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD.' });
    }

    const existingIndex = student.attendanceRecords.findIndex((record) =>
      isSameDay(new Date(record.date), attendanceDate)
    );

    if (existingIndex !== -1) {
      const current = student.attendanceRecords[existingIndex];
      current.status = status !== undefined ? status : !current.status;
    } else {
      student.attendanceRecords.push({
        date: attendanceDate,
        status: status !== undefined ? status : true,
      });
    }

    await student.save();
    res.status(200).json({ message: 'Attendance updated successfully', student: attachAttendanceStats(student) });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a student
// @route   DELETE /api/tuition/delete-student/:id
// @access  Private
exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    res.status(200).json({ message: 'Student deleted successfully', studentId: req.params.id });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update a student
// @route   PUT /api/tuition/update-student/:id
// @access  Private
exports.updateStudent = async (req, res) => {
  try {
    const { name, className, subjectCount, location, monthlyFee, joinedDate } = req.body;

    const student = await Student.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      {
        name,
        className,
        subjectCount: Number(subjectCount),
        location,
        monthlyFee: monthlyFee !== undefined ? Number(monthlyFee) : undefined,
        joinedDate,
      },
      { new: true, runValidators: true }
    );

    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    res.status(200).json({ message: 'Student updated successfully', student: attachAttendanceStats(student) });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Calculate Total Students, Total Teaching Days this month
// @route   GET /api/tuition/dashboard-stats
// @access  Private
exports.getDashboardStats = async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments({ user: req.user._id });

    const now = new Date();
    const startOfCurrentMonth = startOfMonth(now);
    const endOfCurrentMonth = endOfMonth(now);

    // Find all attendance records within the current month that are marked as true (present)
    const attendanceThisMonth = await Student.aggregate([
      { $match: { user: req.user._id } },
      { $unwind: '$attendanceRecords' },
      {
        $match: {
          'attendanceRecords.date': { $gte: startOfCurrentMonth, $lte: endOfCurrentMonth },
          'attendanceRecords.status': true,
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$attendanceRecords.date' } }, // Group by unique date string
        },
      },
    ]);

    const totalTeachingDaysThisMonth = attendanceThisMonth.length;

    res.status(200).json({
      totalStudents,
      totalTeachingDaysThisMonth,
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
