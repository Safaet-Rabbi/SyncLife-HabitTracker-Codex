import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; // Default react-calendar styles
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedDate, setSelectedStudentId } from '../../features/tuition/tuitionSlice';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import AttendanceToggleModal from './AttendanceToggleModal';

const AttendanceCalendar = () => {
  const dispatch = useDispatch();
  const { selectedDate, selectedStudentId, students } = useSelector((state) => state.tuition);

  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [modalDate, setModalDate] = useState(null);

  const onDateChange = (date) => {
    if (!selectedStudentId) {
      toast.warn('Please select a student first to mark attendance.');
      return;
    }
    const localDateString = format(date, 'yyyy-MM-dd');
    dispatch(setSelectedDate(localDateString));
    setModalDate(localDateString);
    setShowAttendanceModal(true);
  };

  const closeModal = () => {
    setShowAttendanceModal(false);
    setModalDate(null);
  };

  // Find the selected student
  const selectedStudent = students.find(s => s._id === selectedStudentId);

  // Function to determine tile content (attendance status)
  const tileContent = ({ date, view }) => {
    if (view === 'month' && selectedStudent) {
      // Normalize the calendar date to a local YYYY-MM-DD string
      const calendarDateFormatted = format(date, 'yyyy-MM-dd');

      const attendanceRecord = selectedStudent.attendanceRecords.find(record => {
        // record.date is likely a UTC ISO string from the backend.
        // Convert it to a Date object, then format it to a local YYYY-MM-DD string for comparison.
        const recordDateObject = new Date(record.date);
        const recordDateFormatted = format(recordDateObject, 'yyyy-MM-dd');
        return recordDateFormatted === calendarDateFormatted;
      });

      if (attendanceRecord) {
        return (
          <div className={`flex justify-center items-center h-full w-full text-xs font-bold rounded-full ${
            attendanceRecord.status ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {attendanceRecord.status ? 'P' : 'A'}
          </div>
        );
      }
    }
    return null;
  };

  // Function to add custom class names to tiles
  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const calendarDateFormatted = format(date, 'yyyy-MM-dd');
      // selectedDate is already a local 'yyyy-MM-dd' string from Redux
      if (calendarDateFormatted === selectedDate) {
        return 'bg-blue-200 dark:bg-blue-700 !rounded-md'; // Highlight selected date
      }
    }
    return null;
  };

  return (
    <div className="bg-white/95 dark:bg-gray-800 backdrop-blur-md rounded-2xl p-6 shadow-md h-fit">
      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">Attendance Calendar</h3>
      
      {/* Student Selection Dropdown */}
      <div className="mb-4">
        <label htmlFor="student-select" className="sr-only">Select Student</label>
        <select
          id="student-select"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          value={selectedStudentId || ''}
          onChange={(e) => dispatch(setSelectedStudentId(e.target.value))}
        >
          <option value="" disabled>Select Student to View/Edit Attendance</option>
          {students.map((s) => (
            <option key={s._id} value={s._id}>{s.name}</option>
          ))}
        </select>
      </div>

      <div className="flex justify-center mb-4">
        <Calendar
          onChange={onDateChange}
          value={new Date(selectedDate)}
          tileContent={tileContent}
          tileClassName={tileClassName}
          className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 rounded-md shadow-inner"
        />
      </div>

      {!selectedStudentId && (
        <div className="mt-4 text-gray-600 dark:text-gray-300 text-center">
          Select a student to view/edit their attendance.
        </div>
      )}

      {showAttendanceModal && selectedStudent && modalDate && (
        <AttendanceToggleModal
          isOpen={showAttendanceModal}
          onClose={closeModal}
          student={selectedStudent}
          date={modalDate}
        />
      )}
    </div>
  );
};

export default AttendanceCalendar;
