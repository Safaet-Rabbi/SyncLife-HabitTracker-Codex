import React from 'react';
import { format, isSameDay } from 'date-fns';
import { FaTimes, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { markAttendance } from '../../features/tuition/tuitionSlice';
import { toast } from 'react-toastify';

const AttendanceToggleModal = ({ isOpen, onClose, student, date }) => {
  const dispatch = useDispatch();
  const { isLoading } = useSelector((state) => state.tuition);

  if (!isOpen || !student || !date) return null;

  const attendanceDate = new Date(date);
  const formattedDate = format(attendanceDate, 'MMM d, yyyy');

  // Find attendance record for the specific student and date
  const studentAttendanceRecord = student.attendanceRecords.find(record =>
    isSameDay(new Date(record.date), attendanceDate)
  );
  const isPresent = studentAttendanceRecord ? studentAttendanceRecord.status : false;

  const handleToggle = async (status) => {
    try {
      await dispatch(markAttendance({ studentId: student._id, date, status })).unwrap();
      toast.success(`${student.name}'s attendance for ${formattedDate} marked ${status ? 'Present' : 'Absent'}!`);
      onClose();
    } catch (error) {
      toast.error(`Failed to update attendance: ${error}`);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-sm">
        <div className="modal-header">
          <h3 className="text-lg font-semibold text-gray-900">
            Attendance for {student.name}
          </h3>
          <button onClick={onClose} className="close-btn">
            <FaTimes size={20} />
          </button>
        </div>
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            Date: <span className="font-medium">{formattedDate}</span>
          </p>
          <p className="text-gray-700 mb-6">
            Current Status:{" "}
            {isPresent ? (
              <span className="inline-flex items-center text-green-600 font-medium">
                <FaCheckCircle className="mr-1" size={16} /> Present
              </span>
            ) : (
              <span className="inline-flex items-center text-red-600 font-medium">
                <FaTimesCircle className="mr-1" size={16} /> Absent
              </span>
            )}
          </p>
          <div className="form-actions !justify-between"> {/* Override default justify-end for space-between */}
            <button
              onClick={() => handleToggle(true)}
              className="btn-small btn-edit mr-2" // Reusing btn-small and btn-edit for styling
              disabled={isLoading || isPresent}
            >
              <FaCheckCircle size={16} className="mr-2" /> Mark Present
            </button>
            <button
              onClick={() => handleToggle(false)}
              className="btn-small btn-delete ml-2" // Reusing btn-small and btn-delete for styling
              disabled={isLoading || !isPresent}
            >
              <FaTimesCircle size={16} className="mr-2" /> Mark Absent
            </button>
          </div>        </div>
      </div>
    </div>
  );
};

export default AttendanceToggleModal;
