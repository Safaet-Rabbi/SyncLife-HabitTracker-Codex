import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { markAttendance, setSelectedStudentId, fetchDashboardStats, deleteStudent } from '../../features/tuition/tuitionSlice';
import { toast } from 'react-toastify';
import { FaEdit, FaTrash, FaCalendar, FaDollarSign, FaMapMarkerAlt, FaCheckCircle, FaUserPlus, FaCalendarAlt } from 'react-icons/fa';
import { format, isSameDay } from 'date-fns';

const StudentCard = ({ student, onOpenEditModal }) => {
  const dispatch = useDispatch();
  const { isLoading, selectedDate, selectedStudentId } = useSelector((state) => state.tuition);

  const joinedDateFormatted = format(new Date(student.joinedDate), 'MMM d, yyyy');
  const selectedDateObj = new Date(selectedDate);
  const selectedDateLabel = format(selectedDateObj, 'MMM d, yyyy');

  // Check if attendance is marked for the selectedDate
  const attendanceRecord = student.attendanceRecords.find(record =>
    isSameDay(new Date(record.date), selectedDateObj)
  );
  const isPresent = attendanceRecord ? attendanceRecord.status : false;

  const handleMarkForSelectedDate = async () => {
    // Determine the status to send: toggle current status or default to true if no record
    const newStatus = attendanceRecord ? !isPresent : true;
    try {
      await dispatch(markAttendance({ studentId: student._id, date: selectedDate, status: newStatus })).unwrap();
      toast.success(`Attendance for ${student.name} marked ${newStatus ? 'Present' : 'Absent'} (${selectedDateLabel})`);
      dispatch(fetchDashboardStats());
    } catch (error) {
      toast.error(`Failed to mark attendance: ${error}`);
    }
  };

  const handleSelectStudent = () => {
    dispatch(setSelectedStudentId(student._id));
  };

  const handleDelete = async (e) => {
    e.stopPropagation(); // Prevent card's onClick from firing
    if (window.confirm(`Are you sure you want to delete ${student.name}?`)) {
      try {
        await dispatch(deleteStudent(student._id)).unwrap();
        toast.success(`${student.name} deleted successfully!`);
        // If the deleted student was the selected one, clear selection
        if (selectedStudentId === student._id) {
            dispatch(setSelectedStudentId(null));
        }
        dispatch(fetchDashboardStats()); // Update dashboard stats after deletion
      } catch (error) {
        toast.error(`Failed to delete student: ${error}`);
      }
    }
  };

  const handleEdit = (e) => {
    e.stopPropagation(); // Prevent card's onClick from firing
    dispatch(setSelectedStudentId(student._id));
    onOpenEditModal();
  };

  return (
    <div
      className={`habit-item ${student._id === selectedStudentId ? 'is-selected' : ''}`}
      style={{ borderLeftColor: '#667eea' }} // Default color, can be made dynamic later
      onClick={handleSelectStudent}
    >
      {/* Edit/Delete Actions */}
      <div className="habit-actions">
        <button className="btn-small btn-edit" onClick={handleEdit}>
          <FaEdit /> Edit
        </button>
        <button className="btn-small btn-delete" onClick={handleDelete}>
          <FaTrash /> Delete
        </button>
      </div>

      <div className="habit-info">
        <h4>{student.name}</h4>
        <p>Class: {student.className} ({student.subjectCount} Subjects)</p>
        <div className="habit-meta">
          <span><FaMapMarkerAlt /> {student.location}</span>
          {student.monthlyFee && (
            <span><FaDollarSign /> ${student.monthlyFee}</span>
          )}
          <span><FaCalendarAlt /> Joined: {joinedDateFormatted}</span>
        </div>
        <div className="habit-meta mt-2">
            <span><FaCheckCircle /> Total Present: {student.totalPresentDays ?? 0}</span>
            <span><FaCalendar /> This Month: {student.monthlyPresentDays ?? 0}</span>
        </div>

      </div>

      {/* Action Button */}
      <div className="mt-6">
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent card's onClick from firing
            handleMarkForSelectedDate();
          }}
          className="btn-primary" // Use btn-primary for overall styling
          disabled={isLoading}
          style={{ 
            backgroundColor: isPresent ? '#11998e' : '#667eea', // Green for present, blue for absent/mark
            backgroundImage: isPresent ? 'linear-gradient(135deg, #11998e, #38ef7d)' : 'linear-gradient(135deg, #667eea, #764ba2)'
          }}
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5 text-white mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : isPresent ? (
            <>
              <FaCheckCircle className="mr-2" /> Present (Selected Date)
            </>
          ) : (
            <>
              <FaUserPlus className="mr-2" /> Mark For Selected Date
            </>
          )}
        </button>
        <p style={{ marginTop: 8, fontSize: '0.85rem', color: '#666' }}>Selected Date: {selectedDateLabel}</p>
      </div>
    </div>
  );
};

export default StudentCard;
